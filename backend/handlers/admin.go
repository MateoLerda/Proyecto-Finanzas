package handlers

import (
	"net/http"

	"mis-finanzas/db"
	"mis-finanzas/models"

	"github.com/gin-gonic/gin"
)

func AdminGetUsers(c *gin.Context) {
	var users []models.User
	db.DB.Find(&users)
	c.JSON(http.StatusOK, users)
}

func AdminUpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := db.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "usuario no encontrado"})
		return
	}
	var input struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Role == "admin" || input.Role == "user" {
		user.Role = input.Role
	}
	db.DB.Save(&user)
	c.JSON(http.StatusOK, user)
}

func AdminDeleteUser(c *gin.Context) {
	id := c.Param("id")
	db.DB.Delete(&models.User{}, id)
	c.JSON(http.StatusOK, gin.H{"message": "usuario eliminado"})
}
