package handlers

import (
	"net/http"

	"mis-finanzas/db"
	"mis-finanzas/models"

	"github.com/gin-gonic/gin"
)

func GetGoals(c *gin.Context) {
	var goals []models.Goal
	db.DB.Find(&goals)
	if goals == nil {
		goals = []models.Goal{}
	}
	c.JSON(http.StatusOK, goals)
}

func CreateGoal(c *gin.Context) {
	var g models.Goal
	if err := c.ShouldBindJSON(&g); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.DB.Create(&g)
	c.JSON(http.StatusCreated, g)
}

func UpdateGoal(c *gin.Context) {
	id := c.Param("id")
	var g models.Goal
	if err := db.DB.First(&g, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "meta no encontrada"})
		return
	}
	var input models.Goal
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	g.Name = input.Name
	g.Target = input.Target
	g.Saved = input.Saved
	db.DB.Save(&g)
	c.JSON(http.StatusOK, g)
}

func DeleteGoal(c *gin.Context) {
	id := c.Param("id")
	db.DB.Delete(&models.Goal{}, id)
	c.JSON(http.StatusOK, gin.H{"message": "eliminado"})
}
