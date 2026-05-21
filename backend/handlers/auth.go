package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"time"

	"mis-finanzas/db"
	"mis-finanzas/middleware"
	"mis-finanzas/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var oauthConfig *oauth2.Config

func InitOAuth() {
	oauthConfig = &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
}

func generateJWT(user models.User) (string, error) {
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, &middleware.Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		},
	})
	return jwtToken.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func firstUserRole() string {
	var count int64
	db.DB.Model(&models.User{}).Count(&count)
	if count == 0 {
		return "admin"
	}
	return "user"
}

func generateToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func sendVerificationEmail(to, link string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")

	if host == "" || user == "" || pass == "" {
		log.Printf("[VERIFY] link de verificación (sin SMTP configurado): %s", link)
		return nil
	}
	if port == "" {
		port = "587"
	}

	body := fmt.Sprintf(`<html><body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
<h2 style="color:#1a1a1a">Confirmá tu cuenta</h2>
<p style="color:#555">Hacé clic en el botón para activar tu cuenta en <strong>Mis Finanzas</strong>:</p>
<a href="%s" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
  Confirmar cuenta
</a>
<p style="color:#aaa;font-size:13px;margin-top:24px">Si no creaste esta cuenta, ignorá este email.</p>
</body></html>`, link)

	msg := []byte(
		"From: " + user + "\r\n" +
			"To: " + to + "\r\n" +
			"Subject: Confirmá tu cuenta — Mis Finanzas\r\n" +
			"MIME-Version: 1.0\r\n" +
			"Content-Type: text/html; charset=UTF-8\r\n" +
			"\r\n" + body,
	)

	auth := smtp.PlainAuth("", user, pass, host)
	return smtp.SendMail(host+":"+port, auth, user, []string{to}, msg)
}

func backendURL(c *gin.Context) string {
	scheme := "https"
	if c.GetHeader("X-Forwarded-Proto") != "https" && c.Request.TLS == nil {
		scheme = "http"
	}
	return scheme + "://" + c.Request.Host
}

func Register(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Name     string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing models.User
	if err := db.DB.Where("email = ?", input.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "el email ya está registrado"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al procesar contraseña"})
		return
	}

	token := generateToken()
	user := models.User{
		Email:             input.Email,
		Name:              input.Name,
		PasswordHash:      string(hash),
		Role:              firstUserRole(),
		EmailVerified:     false,
		VerificationToken: token,
	}
	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al crear usuario"})
		return
	}

	link := backendURL(c) + "/api/auth/verify?token=" + token
	if err := sendVerificationEmail(input.Email, link); err != nil {
		log.Printf("Error enviando email a %s: %v", input.Email, err)
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Revisá tu email para confirmar tu cuenta"})
}

func VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token requerido"})
		return
	}

	var user models.User
	if err := db.DB.Where("verification_token = ?", token).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token inválido o expirado"})
		return
	}

	user.EmailVerified = true
	user.VerificationToken = ""
	db.DB.Save(&user)

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	c.Redirect(http.StatusTemporaryRedirect, frontendURL+"?verified=true")
}

func ResendVerification(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Si el email existe, recibirás el link"})
		return
	}
	if user.EmailVerified {
		c.JSON(http.StatusOK, gin.H{"message": "La cuenta ya está verificada"})
		return
	}

	token := generateToken()
	user.VerificationToken = token
	db.DB.Save(&user)

	link := backendURL(c) + "/api/auth/verify?token=" + token
	if err := sendVerificationEmail(user.Email, link); err != nil {
		log.Printf("Error reenviando email a %s: %v", user.Email, err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email reenviado"})
}

func LoginLocal(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciales inválidas"})
		return
	}

	if user.PasswordHash == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "esta cuenta usa Google. Iniciá sesión con Google"})
		return
	}

	if !user.EmailVerified {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "necesitás confirmar tu email antes de ingresar", "unverified": true})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciales inválidas"})
		return
	}

	signed, err := generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al generar token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": signed})
}

func GoogleLogin(c *gin.Context) {
	url := oauthConfig.AuthCodeURL("state", oauth2.AccessTypeOnline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	token, err := oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "fallo al obtener token de Google"})
		return
	}

	client := oauthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fallo al obtener info del usuario"})
		return
	}
	defer resp.Body.Close()

	var info struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fallo al leer info del usuario"})
		return
	}

	var user models.User
	result := db.DB.Where("google_id = ?", info.ID).First(&user)
	if result.Error != nil {
		role := firstUserRole()
		gid := info.ID
		user = models.User{
			GoogleID:      &gid,
			Email:         info.Email,
			Name:          info.Name,
			Picture:       info.Picture,
			Role:          role,
			EmailVerified: true,
		}
		db.DB.Create(&user)
	} else {
		user.Name = info.Name
		user.Picture = info.Picture
		db.DB.Save(&user)
	}

	signed, err := generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fallo al generar token"})
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	c.Redirect(http.StatusTemporaryRedirect, frontendURL+"?token="+signed)
}

func GetMe(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "usuario no encontrado"})
		return
	}
	c.JSON(http.StatusOK, user)
}
