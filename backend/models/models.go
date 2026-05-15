package models

import "time"

type Transaction struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Type      string    `json:"type"`
	Amount    float64   `json:"amount"`
	Category  string    `json:"category"`
	Date      string    `json:"date"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`
}

type Budget struct {
	ID       uint    `json:"id" gorm:"primaryKey"`
	Category string  `json:"category" gorm:"unique"`
	Limit    float64 `json:"limit"`
}

type Goal struct {
	ID     uint    `json:"id" gorm:"primaryKey"`
	Name   string  `json:"name"`
	Target float64 `json:"target"`
	Saved  float64 `json:"saved"`
}

type Debt struct {
	ID        uint    `json:"id" gorm:"primaryKey"`
	Name      string  `json:"name"`
	Total     float64 `json:"total"`
	Remaining float64 `json:"remaining"`
	Dues      int     `json:"dues"`
	DueDate   string  `json:"due_date"`
}
