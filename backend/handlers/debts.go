package handlers

import (
	"net/http"

	"mis-finanzas/db"
	"mis-finanzas/models"

	"github.com/gin-gonic/gin"
)

func GetDebts(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var debts []models.Debt
	db.DB.Where("user_id = ?", userID).Find(&debts)
	if debts == nil {
		debts = []models.Debt{}
	}
	c.JSON(http.StatusOK, debts)
}

func CreateDebt(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var d models.Debt
	if err := c.ShouldBindJSON(&d); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	d.UserID = userID
	db.DB.Create(&d)
	c.JSON(http.StatusCreated, d)
}

func UpdateDebt(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	id := c.Param("id")
	var d models.Debt
	if err := db.DB.Where("user_id = ? AND id = ?", userID, id).First(&d).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deuda no encontrada"})
		return
	}
	var input models.Debt
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	d.Name = input.Name
	d.Total = input.Total
	d.Remaining = input.Remaining
	d.Dues = input.Dues
	d.DueDate = input.DueDate
	db.DB.Save(&d)
	c.JSON(http.StatusOK, d)
}

func DeleteDebt(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	id := c.Param("id")
	db.DB.Where("user_id = ? AND id = ?", userID, id).Delete(&models.Debt{})
	c.JSON(http.StatusOK, gin.H{"message": "eliminado"})
}
