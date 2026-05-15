package handlers

import (
	"net/http"

	"mis-finanzas/db"
	"mis-finanzas/models"

	"github.com/gin-gonic/gin"
)

func GetBudgets(c *gin.Context) {
	var budgets []models.Budget
	db.DB.Find(&budgets)
	if budgets == nil {
		budgets = []models.Budget{}
	}
	c.JSON(http.StatusOK, budgets)
}

func SaveBudget(c *gin.Context) {
	var b models.Budget
	if err := c.ShouldBindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// upsert por categoría
	var existing models.Budget
	result := db.DB.Where("category = ?", b.Category).First(&existing)
	if result.Error == nil {
		existing.Limit = b.Limit
		db.DB.Save(&existing)
		c.JSON(http.StatusOK, existing)
	} else {
		db.DB.Create(&b)
		c.JSON(http.StatusCreated, b)
	}
}

func DeleteBudget(c *gin.Context) {
	id := c.Param("id")
	db.DB.Delete(&models.Budget{}, id)
	c.JSON(http.StatusOK, gin.H{"message": "eliminado"})
}
