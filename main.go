package main

import (
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
)

func main() {
	port := os.Getenv("PORT")

	isDev := false
	if len(os.Args) == 2 && os.Args[1] == "--dev" {
		port = "8080"
		isDev = true
	}

	e := echo.New()

	e.GET("/api", func(c echo.Context) error {
		return c.String(http.StatusOK, "bnutinb")
	})

	// e.POST("/api/drawing", func(c echo.Context) error {
	// })

	if !isDev {
		e.Static("/", "dist")
	}

	e.Logger.Fatal(e.Start(":" + port))

}
