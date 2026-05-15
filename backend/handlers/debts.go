package handlers

import (
	"net/http"

	"mis-finanzas/db"
	"mis-finanzas/models"

	"github.com/gin-gonic/gin"
)

func GetDebts(c *gin.Context) {
	var debts []models.Debt
	db.DB.Find(&debts)
	if debts == nil {
		debts = []models.Debt{}
	}
	c.JSON(http.StatusOK, debts)
}

func CreateDebt(c *gin.Context) {
	var d models.Debt
	if err := c.ShouldBindJSON(&d); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.DB.Create(&d)
	c.JSON(http.StatusCreated, d)
}

func UpdateDebt(c *gin.Context) {
	id := c.Param("id")
	var d models.Debt
	if err := db.DB.First(&d, id).Error; err != nil {
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
	id := c.Param("id")
	db.DB.Delete(&models.Debt{}, id)
	c.JSON(http.StatusOK, gin.H{"message": "eliminado"})
}
