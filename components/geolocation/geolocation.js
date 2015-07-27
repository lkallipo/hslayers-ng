/**
 * @namespace hs.geolocation
 * @memberOf hs
 */
define(['angular', 'ol'],

    function(angular, ol) {
        angular.module('hs.geolocation', ['hs.map'])
            .directive('hs.geolocation.directive', ['hs.map.service', 'hs.geolocation.service', 'Core', function(OlMap, Geolocation, Core) {
                return {
                    templateUrl: hsl_path + 'components/geolocation/partials/geolocation.html',
                    link: function link(scope, element, attrs) {
                        element.appendTo($(".ol-overlaycontainer-stopevent"));
                        $('.locate .blocate').click(function() {
                            $('.locate').toggleClass('ol-collapsed');
                            Geolocation.geolocation.setTracking(true);
                            Geolocation.toggleFeatures(true);
                        });
                        if (Core.panel_side == 'left') {
                            $('.locate').css({
                                right: '.5em'
                            });
                        }
                        if (Core.panel_side == 'right') {
                            $('.locate').css({
                                right: 'auto',
                                left: '.2em'
                            });
                        }
                    },
                    replace: true
                };
            }])

        .service('hs.geolocation.service', ['hs.map.service', '$rootScope', '$log',
            function(OlMap, $rootScope, $log) {
                var me = {
                    following: false,
                    geolocation: null,
                    toggleFeatures: function(visible) {
                        if (visible) {
                            featuresOverlay.addFeature(accuracyFeature);
                            featuresOverlay.addFeature(positionFeature);
                        } else {
                            featuresOverlay.removeFeature(accuracyFeature);
                            featuresOverlay.removeFeature(positionFeature);

                        }
                    }
                };

                try {
                    var startGpsWatch = function() {
                        if (navigator.geolocation) {
                            $log.debug("Acquiring GPS");
                            me.changed_handler = navigator.geolocation.watchPosition(gpsOkCallback, gpsFailCallback, gpsOptions);
                        }
                    };

                    var gpsOkCallback = function(position) {
                        me.accuracy = position.coords.accuracy ? position.coords.accuracy + ' [m]' : '';
                        me.altitude = position.coords.altitude ? position.coords.altitude + ' [m]' : '-';
                        me.heading = position.coords.heading ? position.coords.heading : null;
                        me.speed = position.coords.speed ? position.coords.speed + ' [m/s]' : '-';
                        var p = ol.proj.transform( /*[position.coords.longitude, position.coords.latitude]*/ [16.631, 49.223], 'EPSG:4326', OlMap.map.getView().getProjection())
                        if (!positionFeature.setGeometry())
                            positionFeature.setGeometry(new ol.geom.Point(p));
                        else positionFeature.getGeometry().setCoordinates(p);
                        if (me.following)
                            OlMap.map.getView().setCenter(p);
                    };

                    var gpsFailCallback = function(e) {
                        var msg = 'Error ' + e.code + ': ' + e.message;
                        $log.error(msg);
                    };

                    var gpsOptions = {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    };

                    me.geolocation = navigator.geolocation.getCurrentPosition(gpsOkCallback, gpsFailCallback, gpsOptions);
                    if (typeof me.geolocation == 'undefined') throw "Geolocation not initialized";

                    startGpsWatch();
                } catch (err) {
                    me.geolocation = new ol.Geolocation({
                        projection: OlMap.map.getView().getProjection()
                    });

                    me.changed_handler = function() {
                        if (!me.geolocation.getTracking()) return;

                        me.accuracy = me.geolocation.getAccuracy() ? me.geolocation.getAccuracy() + ' [m]' : '';
                        me.altitude = me.geolocation.getAltitude() ? me.geolocation.getAltitude() + ' [m]' : '-';
                        me.altitudeAccuracy = me.geolocation.getAltitudeAccuracy() ? '+/- ' + me.geolocation.getAltitudeAccuracy() + ' [m]' : '';
                        me.heading = me.geolocation.getHeading() ? me.geolocation.getHeading() : null;
                        me.speed = me.geolocation.getSpeed() ? me.geolocation.getSpeed() + ' [m/s]' : '-';
                        if (me.geolocation.getPosition()) {
                            var p = me.geolocation.getPosition();
                            $log.info(p);
                            if (!positionFeature.getGeometry())
                                positionFeature.setGeometry(new ol.geom.Point(p));
                            else
                                positionFeature.getGeometry().setCoordinates(p);
                            if (me.following)
                                OlMap.map.getView().setCenter(p);
                        }
                        if (me.heading) OlMap.map.getView().setRotation(me.heading);
                        $rootScope.$broadcast('geolocation.updated');
                    }

                    me.geolocation.on('change', me.changed_handler);

                    // handle geolocation error.
                    me.geolocation.on('error', function(error) {
                        var info = document.getElementById('info');
                        info.innerHTML = error.message;
                        info.style.display = '';
                    });
                };
                //var track = new ol.dom.Input(document.getElementById('track'));
                //track.bindTo('checked', geolocation, 'tracking');

                me.style = new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({
                            color: [242, 121, 0, 0.7]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [0xbb, 0x33, 0x33, 0.7]
                        }),
                        radius: 5
                    }),
                    fill: new ol.style.Fill({
                        color: [0xbb, 0xbb, 0xbb, 0.2]
                    }),
                    stroke: new ol.style.Stroke({
                        color: [0x66, 0x66, 0x00, 0.8]
                    })
                });

                var accuracyFeature = new ol.Feature();
                accuracyFeature.bindTo('geometry', me.geolocation, 'accuracyGeometry');

                var positionFeature = new ol.Feature();

                accuracyFeature.setStyle(me.style);
                positionFeature.setStyle(me.style);


                var featuresOverlay = new ol.FeatureOverlay({
                    map: OlMap.map,
                    features: []
                });


                return me;
            }
        ]).controller('hs.geolocation.controller', ['$scope', 'hs.geolocation.service', function($scope, service) {
            $scope.speed = null;
            $scope.alt = null;
            $scope.altitudeAccuracy = null;

            $scope.getGeolocationProvider = function() {
                return service.geolocation;
            }

            $scope.gpsActive = function(set_to) {
                if (arguments.length == 0)
                    return service.geolocation.getTracking();
                else
                    service.geolocation.setTracking(set_to);
            }

            $scope.following = function(set_to) {
                if (arguments.length == 0)
                    return service.following;
                else {
                    service.following = set_to;
                    service.changed_handler();
                }
            }

            $scope.setFeatureStyle = function(style) {
                return service.style = style;
            }

            $scope.$on('geolocation.updated', function(event) {
                $scope.speed = service.speed;
                $scope.alt = service.altitude;
                $scope.altitudeAccuracy = service.altitudeAccuracy;
                if (!$scope.$$phase) $scope.$digest();
            });
            $scope.$emit('scope_loaded', "Geolocation");
        }]);
    })
