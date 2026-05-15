package handlers

import (
	"net/http"

	"mis-finanzas/db"
	"mis-finanzas/models"

	"github.com/gin-gonic/gin"
)

func GetBudgets(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var budgets []models.Budget
	db.DB.Where("user_id = ?", userID).Find(&budgets)
	if budgets == nil {
		budgets = []models.Budget{}
	}
	c.JSON(http.StatusOK, budgets)
}

func SaveBudget(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var b models.Budget
	if err := c.ShouldBindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	b.UserID = userID
	var existing models.Budget
	result := db.DB.Where("user_id = ? AND category = ?", userID, b.Category).First(&existing)
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
	userID := c.MustGet("userID").(uint)
	id := c.Param("id")
	db.DB.Where("user_id = ? AND id = ?", userID, id).Delete(&models.Budget{})
	c.JSON(http.StatusOK, gin.H{"message": "eliminado"})
}
