package handlers

import (
	"net/http"

	"mis-finanzas/db"
	"mis-finanzas/models"

	"github.com/gin-gonic/gin"
)

func GetTransactions(c *gin.Context) {
	var transactions []models.Transaction
	result := db.DB.Order("date desc, created_at desc").Find(&transactions)
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
	var t models.Transaction
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.DB.Create(&t)
	c.JSON(http.StatusCreated, t)
}

func DeleteTransaction(c *gin.Context) {
	id := c.Param("id")
	db.DB.Delete(&models.Transaction{}, id)
	c.JSON(http.StatusOK, gin.H{"message": "eliminado"})
}
