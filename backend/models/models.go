package models

import "time"

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	GoogleID  string    `json:"google_id" gorm:"uniqueIndex;size:255"`
	Email     string    `json:"email" gorm:"uniqueIndex;size:255"`
	Name      string    `json:"name"`
	Picture   string    `json:"picture"`
	Role      string    `json:"role" gorm:"default:user"`
	CreatedAt time.Time `json:"created_at"`
}

type Transaction struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	Type      string    `json:"type"`
	Amount    float64   `json:"amount"`
	Category  string    `json:"category"`
	Date      string    `json:"date"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`
}

type Budget struct {
	ID       uint    `json:"id" gorm:"primaryKey"`
	UserID   uint    `json:"user_id"`
	Category string  `json:"category"`
	Limit    float64 `json:"limit"`
}

type Goal struct {
	ID     uint    `json:"id" gorm:"primaryKey"`
	UserID uint    `json:"user_id"`
	Name   string  `json:"name"`
	Target float64 `json:"target"`
	Saved  float64 `json:"saved"`
}

type Debt struct {
	ID        uint    `json:"id" gorm:"primaryKey"`
	UserID    uint    `json:"user_id"`
	Name      string  `json:"name"`
	Total     float64 `json:"total"`
	Remaining float64 `json:"remaining"`
	Dues      int     `json:"dues"`
	DueDate   string  `json:"due_date"`
}
