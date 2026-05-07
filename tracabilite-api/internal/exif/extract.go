package exif

import (
	"fmt"
	"io"

	goexif "github.com/rwcarlsen/goexif/exif"
	"github.com/rwcarlsen/goexif/mknote"
)

type GPS struct {
	Latitude  float64
	Longitude float64
}

// ExtractGPS lit une image (JPEG/PNG) et extrait la position GPS EXIF.
// Retourne une erreur si aucune coordonnée n'est disponible.
func ExtractGPS(r io.Reader) (GPS, error) {
	// Support des tags manufacturer notes pour certains devices.
	goexif.RegisterParsers(mknote.All...)

	x, err := goexif.Decode(r)
	if err != nil {
		return GPS{}, fmt.Errorf("exif decode: %w", err)
	}
	lat, lon, err := x.LatLong()
	if err != nil {
		return GPS{}, fmt.Errorf("exif gps: %w", err)
	}
	if lat == 0 || lon == 0 {
		return GPS{}, fmt.Errorf("coordonnees GPS EXIF manquantes")
	}
	return GPS{Latitude: lat, Longitude: lon}, nil
}

