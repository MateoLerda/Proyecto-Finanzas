package db

import (
	"log"
	"os"

	"mis-finanzas/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() {
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		log.Fatal("Variable de entorno MYSQL_DSN no configurada")
	}

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Error al abrir la base de datos:", err)
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.Transaction{},
		&models.Budget{},
		&models.Goal{},
		&models.Debt{},
	)
	if err != nil {
		log.Fatal("Error en AutoMigrate:", err)
	}
}
