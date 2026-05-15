package db

import (
	"log"

	"mis-finanzas/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() {
	var err error
	DB, err = gorm.Open(sqlite.Open("finanzas.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Error al abrir la base de datos:", err)
	}

	err = DB.AutoMigrate(
		&models.Transaction{},
		&models.Budget{},
		&models.Goal{},
		&models.Debt{},
	)
	if err != nil {
		log.Fatal("Error en AutoMigrate:", err)
	}
}
