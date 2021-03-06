$(document).on('ready', function(){
  $('#search-bar').on('keyup', function(e){
    var key = e.which ? e.which : e.keyCode;

    if(items !== undefined){
      var narrowedDownItems = searchItemsLike($('#search-bar').val(), items);
    }
  });
});

function searchItemsLike(theString, searchItems){
  var reg = new RegExp(theString, 'i');
  var newList = [];

  searchItems.forEach(function (val){
    var singleItem = val.val();
    for(var index in singleItem){
      if(reg.test(singleItem[index]) && typeof singleItem[index] == "string"){
        newList.push(val);
        break;
      }
    }
  });

  clearList();
  newList.forEach(function (val){
    addSquare(val.val(), val.key());
  });
}

var firebase = "https://delivernow.firebaseio.com/";
var placeSearch, autocomplete;

var rootRef = new Firebase(firebase);

var items;

function makeDemand(){
  var data = $(document.forms.demand).serialize();
  $.ajax({
    url: "./demand",
    method: "POST",
    data: data,
    dataType: "json"
  }).done(function (data){
    $(".req").hide();
    if(data.errors === undefined){
      $('#demandModal').modal('hide');
    }else{
      data.errors.forEach(function (item){
        $("[id^="+item.errorType+"-r]").show();
      });
    }
    //console.log(data);
  }).fail(function (data){
    //console.log(data);
  });
}

function fillInAddress() {
  // Get the place details from the autocomplete object.
  var place = autocomplete.getPlace();

  // Get each component of the address from the place details
  // and fill the corresponding field on the form.
  $("#autocomplete").val(place);
  $("#lat").val(place.geometry.location.lat());
  $("#lng").val(place.geometry.location.lng());
}

function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      $("#lat").val(position.coords.latitude);
      $("#lng").val(position.coords.longitude);
    });
  }
}

function refreshList(list){
  if(list != null){
    clrCurr = true;
    items = list;
    deleteMarkers();
    clearList();
    list.forEach(function (val){
      if(curr !== undefined){
        if(curr == val.key()){
          clrCurr = false;
        }
      }
      addSquare(val.val(), val.key());
    });
    setMapOnAll(map);
    if(clrCurr == true){
      curr = undefined;
    }
    refreshActions();
  }

  if($('#search-bar').val() != ""){
    $('#search-bar').trigger('keypress');
  }
}

function refreshActions(){
  $("#finishedbtn").hide();
  $("#deliverbtn").hide();
  if(curr !== undefined){
    if(items.child(curr).val().owner == myuname){
      $("#finishedbtn").show();
    }else if(items.child(curr).val().deliverer === undefined){
      $("#deliverbtn").show();
    }
  }
}

function bringIt(){
  if(curr !== undefined){
    if(items.child(curr).val().owner != myuname && items.child(curr).val().deliverer === undefined){
      $("#deliverbtn").show();
      var data = items.child(curr).val();
      data.deliverer = myuname;
      data.destination.lat = parseFloat(data.destination.lat);
      data.destination.lng = parseFloat(data.destination.long);
      data.id = curr;
      $.ajax({
        url: "./demand",
        method: "PUT",
        data: data,
        dataType: "json"
      }).done(function (data){
        console.log(data);
      }).fail(function (data){
        console.log(data);
      });
    }else{
      $("#deliverbtn").show();
    }
  }
}

function finishedDelivery(){
  $.ajax({
    url: "./demand/"+curr,
    method: "DELETE",
    dataType: "json",
    success: function(data){
    },
    error: function(e){
    },
    complete: function(){
    }
  });
}

function clearList(){
  $("#result-list").html("");
}

var curr;

function addSquare(item, key){
  addMarker({lat: parseFloat(item.destination.lat), lng: parseFloat(item.destination.long)}, item.item);
  var curr = $("#result-list").html();
  curr += "<div class='resbox' onclick='map.setCenter({lat: " + parseFloat(item.destination.lat) + ", "+
    "lng: " + parseFloat(item.destination.long)+ "}); curr = \""+key+"\"; refreshActions();'>";
  curr += "<h4>" + item.fname + " needs " + item.item + "</h4>";
  curr += "<h5 class='price'>Predicted price of item $" + item.price;

  if(item.deliverer === undefined){
    curr += "<span class='label label-success tip'>$" + item.tip + " tip</span>";
  }else{
    curr += "<span class='label label-danger tip'>Bringing it</span>";
  }

  curr += "</h5>";

  curr += "<strong>Available @ </strong>" + item.shop + "<br>";
  curr += "<strong>Deliver to </strong>" + item.destination.label + "<br>";
  if(comments !== undefined){
    curr += "<p class='last-p'><strong>Comments: </strong>" + item.comments + "</p>";
  }
  curr += "</div><hr class='small-hr'>";
  $("#result-list").html(curr);
}

function loader(snapshot){
  var ret = snapshot;
  if(ret === null){
    refreshList(null);
  }else{
    refreshList(ret);
  }
}

$(document).ready(function(){
  geolocate();

  rootRef.child("demands").on("value", loader);

});

var loggingOut = false;

function logOut(){
  if(!loggingOut){
    loggingOut = true;
    var width = $('#logoutbtn').outerWidth();
    $('#logoutbtn').html("<i class='fa fa-spin fa-spinner' style='font-size: 0.75em;'></i>").css('width', width);

    $.ajax({
      method: "POST",
      url: "./user/logout",
      dataType: "json",
      success: function(data){
          // Logged out
          loggingOut = false;

          window.location = "/";
      },
      error: function(e){
        //console.log(e);
      },
      complete: function(){
        $('#logoutbtn').html("Log Out");
      }
    });
  }
}
var map;
var markers = [];
function initMap() {

  // Create the autocomplete object, restricting the search to geographical
  // location types.
  autocomplete = new google.maps.places.Autocomplete(
      /** @type {!HTMLInputElement} */(document.getElementById('dest')),
      {types: ['geocode']});

  // When the user selects an address from the dropdown, populate the address
  // fields in the form.

  autocomplete.addListener('place_changed', fillInAddress);

  var mapDiv = document.getElementById('map-canvas');
  map = new google.maps.Map(mapDiv, {
    center: {lat: 45.5024270, lng: -73.5722630},
    zoom: 10
  });
}

// Adds a marker to the map and push to the array.
function addMarker(location, label) {
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    title: label
  });
  markers.push(marker);
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
  setMapOnAll(null);
}

// Shows any markers currently in the array.
function showMarkers() {
  setMapOnAll(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
  clearMarkers();
  markers = [];
}
