package handlers

import (
	"context"
	"encoding/json"
	"net/http"
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

// Register crea una cuenta local con email + contraseña
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

	user := models.User{
		Email:        input.Email,
		Name:         input.Name,
		PasswordHash: string(hash),
		Role:         firstUserRole(),
	}
	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al crear usuario"})
		return
	}

	signed, err := generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al generar token"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"token": signed})
}

// LoginLocal autentica una cuenta local con email + contraseña
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
			GoogleID: &gid,
			Email:    info.Email,
			Name:     info.Name,
			Picture:  info.Picture,
			Role:     role,
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
