package main

import (
	"os"

	"github.com/labstack/echo/v4"
)

func main() {
	port, ok := os.LookupEnv("PORT")

	if !ok {
		port = "8080"
	}

	e := echo.New()

	// e.GET("/api", func(c echo.Context) error {
	// 	return c.String(http.StatusOK, "bnutinb")
	// })
	//
	// e.POST("/api/drawing", func(c echo.Context) error {
	// })

	e.Static("/quickdraw/", "docs")

	e.Logger.Fatal(e.Start(":" + port))

}
