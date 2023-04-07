/* global google */
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { GoogleMap, StandaloneSearchBox, LoadScript, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import 'bootstrap/dist/css/bootstrap.min.css';

function MapDirectionsRenderer(props) {
    const [directions, setDirections] = useState(null);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const { places, travelMode } = props;
  
      const waypoints = places.map(p => ({
        location: { lat: p.place.geometry.location.lat(), lng: p.place.geometry.location.lng() },
        stopover: true
      }));
      const origin = waypoints.shift().location;
      const destination = waypoints.pop().location;
  
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: travelMode,
          waypoints: waypoints
        },
        (result, status) => {
          console.log(result)
          if (status === google.maps.DirectionsStatus.OK) {
            setDirections(result);
            props.correctError();
            props.calcDist(result);
            props.calcTime(result);
          } else {
            setError(result);
            props.handleError();
          }
        }
      );
    }, [props.places, props.travelMode]);
  
    return (
      directions && (
        <DirectionsRenderer directions={directions} />
      )
    );
  }

  export default MapDirectionsRenderer;