package main

import (
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	http.Handle("/", http.FileServer(http.Dir("./dist")))
	http.ListenAndServe(":"+port, nil)
}
