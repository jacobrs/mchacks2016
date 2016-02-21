var placeSearch, autocomplete;
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
    console.log(data);
  }).fail(function (data){
    console.log(data);
  });
}

function fillInAddress() {
  // Get the place details from the autocomplete object.
  var place = autocomplete.getPlace();

  // Get each component of the address from the place details
  // and fill the corresponding field on the form.
  $("#autocomplete").val(place);
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

$(document).ready(function(){
  geolocate();
});

var loggingOut = false;

function logOut(){
  if(!loggingOut){
    loggingOut = true;
    var width = $('#logoutbtn').outerWidth();
    $('#logoutbtn').html("<i class='fa fa-spin fa-spinner' style='font-size: 0.75em;'></i>").css('width', width);

    $.ajax({
      type: "POST",
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
  var map = new google.maps.Map(mapDiv, {
    center: {lat: 45.5024270, lng: -73.5722630},
    zoom: 10
  });
}
