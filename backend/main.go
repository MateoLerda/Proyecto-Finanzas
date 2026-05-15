package main

import (
	"os"

	"mis-finanzas/db"
	"mis-finanzas/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db.Init()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: false,
	}))

	api := r.Group("/api")
	{
		api.GET("/transactions", handlers.GetTransactions)
		api.POST("/transactions", handlers.CreateTransaction)
		api.DELETE("/transactions/:id", handlers.DeleteTransaction)

		api.GET("/budgets", handlers.GetBudgets)
		api.POST("/budgets", handlers.SaveBudget)
		api.DELETE("/budgets/:id", handlers.DeleteBudget)

		api.GET("/goals", handlers.GetGoals)
		api.POST("/goals", handlers.CreateGoal)
		api.PUT("/goals/:id", handlers.UpdateGoal)
		api.DELETE("/goals/:id", handlers.DeleteGoal)

		api.GET("/debts", handlers.GetDebts)
		api.POST("/debts", handlers.CreateDebt)
		api.PUT("/debts/:id", handlers.UpdateDebt)
		api.DELETE("/debts/:id", handlers.DeleteDebt)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
