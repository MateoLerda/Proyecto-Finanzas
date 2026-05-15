package handlers

import (
	"net/http"

	"mis-finanzas/db"
	"mis-finanzas/models"

	"github.com/gin-gonic/gin"
)

func GetTransactions(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var transactions []models.Transaction
	result := db.DB.Where("user_id = ?", userID).Order("date desc, created_at desc").Find(&transactions)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	if transactions == nil {
		transactions = []models.Transaction{}
	}
	c.JSON(http.StatusOK, transactions)
}

func CreateTransaction(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var t models.Transaction
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	t.UserID = userID
	db.DB.Create(&t)
	c.JSON(http.StatusCreated, t)
}

func DeleteTransaction(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	id := c.Param("id")
	db.DB.Where("user_id = ? AND id = ?", userID, id).Delete(&models.Transaction{})
	c.JSON(http.StatusOK, gin.H{"message": "eliminado"})
}
