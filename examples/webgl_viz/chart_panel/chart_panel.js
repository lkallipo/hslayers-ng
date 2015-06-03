define(['angular', 'ol', 'map', 'd3'],

    function(angular, ol, map) {
        angular.module('hs.widgets.chart_panel', ['hs.map'])
            .service('chart_panel_service', ['OlMap', function(OlMap) {
                var me = {
                };

                return me;
            }])
            .directive('chartpanel', function() {
                return {
                    templateUrl: hsl_path + 'examples/webgl_viz/chart_panel/partials/template.html',
                    link: function(scope, element) {
                        var link = document.createElement("link");
                        link.type = "text/css";
                        link.rel = "stylesheet";
                        link.href = hsl_path + 'lib/range_slider.css';
                        document.getElementsByTagName("head")[0].appendChild(link);
                    }
                };
            })

        .controller('ChartPanel', ['$scope', 'OlMap', 'chart_panel_service',
            function($scope, OlMap, chart_panel_service) {
                
            }
        ]);

    });