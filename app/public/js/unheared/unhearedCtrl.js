'use strict';

app.controller('UnhearedCtrl', function (
    $scope,
	$rootScope,
    SCapiService,
    SC2apiService,
    utilsService
) {
    var tracksIds = [];

    $scope.title = 'Unheared';
    $scope.data = '';
    $scope.busy = false;

    SC2apiService.getStream()
        .then(filterCollection)
        .then(function (collection) {
            $scope.data = collection.reverse();

        })
        .catch(function (error) {
            console.log('error', error);
        })
        .finally(function () {
            utilsService.updateTracksLikes($scope.data);
            utilsService.updateTracksReposts($scope.data);
            $rootScope.isLoading = false;
        });

    $scope.loadMore = function() {
        if ( $scope.busy ) {
            return;
        }
        $scope.busy = true;

        SC2apiService.getNextPage()
            .then(filterCollection)
            .then(function (collection) {
                $scope.data = collection.reverse().concat($scope.data);
                utilsService.updateTracksLikes(collection, true);
                utilsService.updateTracksReposts(collection, true);
            }, function (error) {
                console.log('error', error);
            }).finally(function () {
                $scope.busy = false;
                $rootScope.isLoading = false;
            });
    };

    function filterCollection(data) {
        return data.collection.filter(function (item) {

            console.log('info', 'FILTER: ' + JSON.stringify(item, null, 4));
            // Keep only tracks (remove playlists, etc)
            var isTrackType = item.type === 'track' ||
                              item.type === 'track-repost' ||
                              !!(item.track && item.track.streamable);
            if (!isTrackType) {
                return false;
            }

            // Filter reposts: display only first appearance of track in stream
            var exists = tracksIds.indexOf(item.track.id) > -1;
            if (exists) {
                return false;
            }

            // nothing longer than 15 minutes
            var duration = item.duration || 0;
            if (duration > 15*60*1000) {
                return false;
            }

            // nothing before 8.9.2016
            var createdAt = new Date(item.created_at);
            if (createdAt.getTime() < new Date(2016, 9, 8, 0, 0, 0, 0)) {
                return false;
            }

            // "stream_url" property is missing in V2 API
            item.track.stream_url = item.track.uri + '/stream';

            tracksIds.splice(0, 0, item.track.id);
            console.log('info', 'PASSED');
            return true;
        });
    }

});