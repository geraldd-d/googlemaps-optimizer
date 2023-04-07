/* global google */

import React, { useRef, useMemo, useState } from 'react';
import { GoogleMap, StandaloneSearchBox, LoadScript, MarkerF} from '@react-google-maps/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCallback } from 'react';
import "./styles/stuff.css";
import MapDirectionsRenderer from './components/MapDirectionsRenderer';
import './index.css';

const libraries = ["places"];
function App() {

    const inputRef = useRef();
    const [newID, setNewID] = useState(3);
    const [place, setPlace] = useState(0);
    const [waypoints, setWaypoints] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState(false);
    const [mode, setMode] = useState("DRIVING");
    const [hours, setHours] = useState(0);
    const [mins, setMins] = useState(0);
    const [distance, setDistance] = useState(0);

    // map settings
    const mapRef = useRef();
    const center = useMemo(() => ({ lat: 1.3483, lng: 103.6831 }), []);
    const options = {
      disableDefaultUI: true,
      clickableIcons: false,
    }
    
    const onLoad = useCallback((map) => {
      mapRef.current = map;
      setTimeout(() => {
          if (!mapRef.current || !mapRef.current.getBounds()) {
              // Map failed to load, reload the page
              window.location.reload();
          }
      }, 5000); // Wait 5 seconds before checking if the map has loaded
    },[]);

    const handleChange = () => { 
      const [ place ] = inputRef.current.getPlaces();
      setInputValue(place ? place.formatted_address : '');
      if(place) { 
          setPlace(place);
       } 
      console.log(place);
    };

    // toggle between travel modes
    const toDrive = () =>{
      setMode("DRIVING");
      console.log(place);
    }
    const toBike = () =>{
      setMode("BICYCLING");
    }
    const toWalk = () =>{
      setMode("WALKING");
    }
    const toBus = () =>{
      setMode("TRANSIT");
    }
    // iterative panTo to simulate panning effect
    var slowPanTo = function(map, endPosition, n_intervals, T_msec) {
      var f_timeout, getStep, i, j, lat_array, lat_delta, lat_step, lng_array, lng_delta, lng_step, pan, ref, startPosition;
      getStep = function(delta) {
        return parseFloat(delta) / n_intervals;
      };
      startPosition = map.getCenter();
      lat_delta = endPosition.lat() - startPosition.lat();
      lng_delta = endPosition.lng() - startPosition.lng();
      lat_step = getStep(lat_delta);
      lng_step = getStep(lng_delta);
      lat_array = [];
      lng_array = [];
      for (i = j = 1, ref = n_intervals; j <= ref; i = j += +1) {
        lat_array.push(map.getCenter().lat() + i * lat_step);
        lng_array.push(map.getCenter().lng() + i * lng_step);
      }
      f_timeout = function(i, i_min, i_max) {
        return parseFloat(T_msec) / n_intervals;
      };
      pan = function(i) {
        if (i < lat_array.length) {
          return setTimeout(function() {
            map.panTo(({
              lat: lat_array[i],
              lng: lng_array[i]
            }));
            return pan(i + 1);
          }, f_timeout(i, 0, lat_array.length - 1));
        }
      };
      return pan(0);
    };

    // waypoint methods
    const handleInsert = () => {
      var duplicate = false;
      setInputValue('');
      for (var i = 0;i < waypoints.length;i++){
        if (place === waypoints[i].place){
            duplicate = true;
        }
      }
      if (!duplicate){
        const newWP = { id : newID, place : place};
        setWaypoints([...waypoints, newWP]);
        setNewID(newID+1);
      }
      if (place && place.geometry) {
        slowPanTo(mapRef.current, place.geometry.location, 50, 300);
        setPlace('0');
      }
      console.log(waypoints);
     }

    const handleDelete = (index) => {
      const newWaypoints = waypoints.filter(w => w.id !== index);
      setWaypoints(newWaypoints);
    }

    // TSP, using nearest neighbor algo for reasonable answer that does not take too long... come back to this next time, try dynamic prog
    const optimiseRoute = () => {
      if (waypoints.length <= 1){
        return;
      }
      const tempWP = [...waypoints];
      var minDistance = 0;
      var minIndex, temp;
      var i,j;
      for (i = 1; i < waypoints.length; i++){
        minDistance = 0;
        minIndex = 0;
        for (j = i; j < waypoints.length; j++){
          var distance = google.maps.geometry.spherical.computeDistanceBetween(tempWP[i-1].place.geometry.location, tempWP[j].place.geometry.location);
          if (minDistance === 0 || distance < minDistance){
            minIndex = j;
            minDistance = distance;
          }
        }
        temp = tempWP[i];
        tempWP[i] = tempWP[minIndex];
        tempWP[minIndex] = temp;
      }
      setWaypoints(tempWP);
    }
    const handleError = () =>{
      setError(true);
    }
    const correctError = () =>{
      setError(false);
    }
    const calcTime = (directions) =>{
      const routes = directions.routes[0].legs
      var total_time = 0, i;
      for (i = 0; i < routes.length; i++)
      {
        total_time += routes[i].duration.value;
      }
      setHours(Math.floor(total_time/3600));
      setMins(Math.floor(((total_time % 60))));
      console.log(hours);
    }
    const calcDist = (directions) =>{
      const routes = directions.routes[0].legs
      var total_dist = 0, i;
      for (i = 0; i < routes.length; i++)
      {
        total_dist += routes[i].distance.value;
      }
      setDistance(total_dist/1000);
      console.log(distance);
    }

    return (
    <React.Fragment>
    <LoadScript googleMapsApiKey={process.env.REACT_APP_APIKEY} libraries = {libraries}>

    <div className='big_container'>
      <div className='controls'>
        <div>
          <h1 className = "font-thin" style = {{position : 'absolute', top : '70%', left : '2%'}}>Time: {hours} hours, {mins} minutes</h1>
          <h1 className = "font-thin" style = {{position : 'absolute', top : '75%', left : '2%'}}>Distance: {distance} km</h1>
        </div>
          <div>
            <button className = "bg-blue-300 hover:bg-blue-700 text-white py-1 px-3 rounded font-thin" onClick={toBike} style = {{'position':'absolute', top : '3%', left : '1%'}}>🚴</button>
            <button className = "bg-blue-300 hover:bg-blue-700 text-white py-1 px-3 rounded font-thin" onClick={toDrive} style = {{'position':'absolute', top : '3%', left : '5%'}}>🚗</button>
            <button className = "bg-blue-300 hover:bg-blue-700 text-white py-1 px-3 rounded font-thin" onClick={toWalk} style = {{'position':'absolute', top : '3%', left : '9%'}}>🚶</button>
            <button className = "bg-blue-300 hover:bg-blue-700 text-white py-1 px-3 rounded font-thin" onClick={toBus} style = {{'position':'absolute', top : '3%', left : '12.5%'}}>🚌</button>
          </div>
                <StandaloneSearchBox
                    onLoad={ref => inputRef.current = ref}
                    onPlacesChanged={handleChange}
                >
                    <input
                        style = {{position : 'absolute' , height : '5vh', top: '9%', left : '1%', width: '15%'}}
                        type="text"
                        className="form-control"
                        placeholder="Enter Location"
                        value = {inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                </StandaloneSearchBox>
                {(inputRef.current && place != 0) ? <button className = "bg-blue-500 hover:bg-blue-700 text-white py-1 px-4 rounded font-thin" onClick = {handleInsert} type = 'button' style = {{position : 'absolute' , height : '5vh', top: '9%', left : '17%'}}> Add </button> : <h1></h1>}

        <div className="h-80 w-200 overflow-y-scroll scrollbar-thin scrollbar-track-blue-200 scrollbar-thumb-blue-500" style={{paddingLeft: '20px', marginTop: '-100px'}}> 
          {waypoints.map((waypoint) => (
          <div class = "flex justify-between" key = {waypoint.id}>
            <p className="flex font-thin m-2">{waypoint.place.formatted_address.substring(0,40)}
            <button className = "self-center bg-slate-600 hover:bg-red-700 py-2 px-2 rounded m-2" onClick = {()=> handleDelete(waypoint.id)}></button>
            </p>
          </div>
          ))}
        </div>
        <div style = {{'position' : 'absolute', 'top':'85%', 'left': '6%'}}>
          {!error && waypoints.length >= 3 && (
          <button className = "bg-blue-500 hover:bg-blue-700 text-white py-1 px-4 rounded font-thin" onClick = {optimiseRoute}> Optimise Route </button>)}
          {error &&
          <h1 className = "text-xl">No Route Found.</h1>
          }
        </div>
      </div>

      <div style={{ height: '100vh', width: '100%' , float : 'right', padding : 0, flexGrow : 1}}>
          <GoogleMap 
          ref = {mapRef}
          center={center}
          zoom = {15} 
          mapContainerStyle = {{width:'100%', height: '100%'}}
          options = {options}
          onLoad = {onLoad}>
          {waypoints.map((waypoint) => (<MarkerF key= {waypoint.id} position = {waypoint.place.geometry.location}/>
        ))}
          {waypoints.length >= 2? <MapDirectionsRenderer calcTime = {calcTime} calcDist = {calcDist} handleError = {handleError} correctError = {correctError} places={waypoints} travelMode={mode} ></MapDirectionsRenderer> : <h1> </h1>}
          </GoogleMap>
      </div>
    </div>
    </LoadScript>
    </React.Fragment>
    );
}

export default App;


