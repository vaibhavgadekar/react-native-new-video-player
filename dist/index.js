import { __awaiter, __rest } from "tslib";
import { Audio, Video } from 'expo-av';
import { ActivityIndicator, Animated, Dimensions, Image, StyleSheet, Text, TouchableWithoutFeedback, View, } from 'react-native';
import { ControlStates, ErrorSeverity, PlaybackStates } from './constants';
import { ErrorMessage, TouchableButton, deepMerge, getMinutesSecondsFromMilliseconds, styles, } from './utils';
import { MaterialIcons } from '@expo/vector-icons';
import { defaultProps } from './props';
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import Slider from '@react-native-community/slider';
import Pressable from "react-native/Libraries/Components/Pressable/Pressable";
const VideoPlayer = (tempProps) => {
    const props = deepMerge(defaultProps, tempProps);
    let playbackInstance = null;
    let controlsTimer = null;
    let initialShow = props.defaultControlsVisible;
    const [errorMessage, setErrorMessage] = useState('');
    const controlsOpacity = useRef(new Animated.Value(props.defaultControlsVisible ? 1 : 0)).current;
    const [controlsState, setControlsState] = useState(props.defaultControlsVisible ? ControlStates.Visible : ControlStates.Hidden);
    const [playbackInstanceInfo, setPlaybackInstanceInfo] = useState({
        position: 0,
        duration: 0,
        state: props.videoProps.source ? PlaybackStates.Loading : PlaybackStates.Error,
    });
    // We need to extract ref, because of misstypes in <Slider />
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _a = props.slider, { ref: sliderRef } = _a, sliderProps = __rest(_a, ["ref"]);
    const screenRatio = props.style.width / props.style.height;
    let videoHeight = props.style.height;
    let videoWidth = videoHeight * screenRatio;
    if (videoWidth > props.style.width) {
        videoWidth = props.style.width;
        videoHeight = videoWidth / screenRatio;
    }
    useEffect(() => {
        setAudio();
        return () => {
            if (playbackInstance) {
                playbackInstance.setStatusAsync({
                    shouldPlay: false,
                });
            }
        };
    }, []);
    useEffect(() => {
        if (!props.videoProps.source) {
            console.error('[VideoPlayer] `Source` is a required in `videoProps`. ' +
                'Check https://docs.expo.io/versions/latest/sdk/video/#usage');
            setErrorMessage('`Source` is a required in `videoProps`');
            setPlaybackInstanceInfo(Object.assign(Object.assign({}, playbackInstanceInfo), { state: PlaybackStates.Error }));
        }
        else {
            setPlaybackInstanceInfo(Object.assign(Object.assign({}, playbackInstanceInfo), { state: PlaybackStates.Playing }));
        }
    }, [props.videoProps.source]);
    const hideAnimation = () => {
        Animated.timing(controlsOpacity, {
            toValue: 0,
            duration: props.animation.fadeOutDuration,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                setControlsState(ControlStates.Hidden);
            }
        });
    };
    const animationToggle = () => {
        if (controlsState === ControlStates.Hidden) {
            Animated.timing(controlsOpacity, {
                toValue: 1,
                duration: props.animation.fadeInDuration,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    setControlsState(ControlStates.Visible);
                }
            });
        }
        else if (controlsState === ControlStates.Visible) {
            hideAnimation();
        }
        if (controlsTimer === null) {
            controlsTimer = setTimeout(() => {
                if (playbackInstanceInfo.state === PlaybackStates.Playing &&
                    controlsState === ControlStates.Hidden) {
                    hideAnimation();
                }
                if (controlsTimer) {
                    clearTimeout(controlsTimer);
                }
                controlsTimer = null;
            }, 3000);
        }
    };
    // Set audio mode to play even in silent mode (like the YouTube app)
    const setAudio = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
            });
        }
        catch (e) {
            props.errorCallback({
                type: ErrorSeverity.NonFatal,
                message: 'Audio.setAudioModeAsync',
                obj: e,
            });
        }
    });
    const updatePlaybackCallback = (status) => {
        props.playbackCallback(status);
        if (status.isLoaded) {
            setPlaybackInstanceInfo(Object.assign(Object.assign({}, playbackInstanceInfo), {
                position: status.positionMillis, duration: status.durationMillis || 0, state: status.didJustFinish
                    ? PlaybackStates.Ended
                    : status.isBuffering
                        ? PlaybackStates.Buffering
                        : status.shouldPlay
                            ? PlaybackStates.Playing
                            : PlaybackStates.Paused
            }));
            if ((status.didJustFinish && controlsState === ControlStates.Hidden) ||
                (status.isBuffering && controlsState === ControlStates.Hidden && initialShow)) {
                animationToggle();
                initialShow = false;
            }
        }
        else {
            if (status.isLoaded === false && status.error) {
                const errorMsg = `Encountered a fatal error during playback: ${status.error}`;
                setErrorMessage(errorMsg);
                props.errorCallback({ type: ErrorSeverity.Fatal, message: errorMsg, obj: {} });
            }
        }
    };


    const forward10 = (status) => {
        // props.playbackCallback(status);
        console.log(status.positionMillis);
        if (status.isLoaded) {
            setPlaybackInstanceInfo(Object.assign(Object.assign({}, playbackInstanceInfo), {
                position: status.positionMillis + 10000, duration: status.durationMillis || 0, state: status.didJustFinish
                    ? PlaybackStates.Ended
                    : status.isBuffering
                        ? PlaybackStates.Buffering
                        : status.shouldPlay
                            ? PlaybackStates.Playing
                            : PlaybackStates.Paused
            }));
            if ((status.didJustFinish && controlsState === ControlStates.Hidden) ||
                (status.isBuffering && controlsState === ControlStates.Hidden && initialShow)) {
                animationToggle();
                initialShow = false;
            }
        }
        else {
            if (status.isLoaded === false && status.error) {
                const errorMsg = `Encountered a fatal error during playback: ${status.error}`;
                setErrorMessage(errorMsg);
                props.errorCallback({ type: ErrorSeverity.Fatal, message: errorMsg, obj: {} });
            }
        }
    }
    const togglePlay = () => __awaiter(void 0, void 0, void 0, function* () {
        if (controlsState === ControlStates.Hidden) {
            return;
        }
        const shouldPlay = playbackInstanceInfo.state !== PlaybackStates.Playing;
        if (playbackInstance !== null) {
            yield playbackInstance.setStatusAsync(Object.assign({ shouldPlay }, (playbackInstanceInfo.state === PlaybackStates.Ended && { positionMillis: 0 })));
            setPlaybackInstanceInfo(Object.assign(Object.assign({}, playbackInstanceInfo), {
                state: playbackInstanceInfo.state === PlaybackStates.Playing
                    ? PlaybackStates.Paused
                    : PlaybackStates.Playing
            }));
            if (shouldPlay) {
                animationToggle();
            }
        }
    });
    if (playbackInstanceInfo.state === PlaybackStates.Error) {
        return (<View style={{
            backgroundColor: props.style.videoBackgroundColor,
            width: videoWidth,
            height: videoHeight,
        }}>
            <ErrorMessage style={props.textStyle} message={errorMessage} />
        </View>);
    }
    if (playbackInstanceInfo.state === PlaybackStates.Loading) {
        return (<View style={{
            backgroundColor: props.style.controlsBackgroundColor,
            width: videoWidth,
            height: videoHeight,
            justifyContent: 'center',
        }}>
            {props.icon.loading || <ActivityIndicator {...props.activityIndicator} />}
        </View>);
    }
    return (<View style={{
        backgroundColor: props.style.videoBackgroundColor,
        width: videoWidth,
        height: videoHeight,
        maxWidth: '100%',
    }}>
        <Video style={styles.videoWrapper} {...props.videoProps} ref={component => {
            playbackInstance = component;
            if (props.videoProps.ref) {
                props.videoProps.ref.current = component;
            }
        }} onPlaybackStatusUpdate={updatePlaybackCallback} />

        <TouchableWithoutFeedback onPress={animationToggle}>
            <Animated.View style={Object.assign(Object.assign({}, StyleSheet.absoluteFillObject), { opacity: controlsOpacity, justifyContent: 'center', alignItems: 'center' })}>

                <View style={Object.assign(Object.assign({}, StyleSheet.absoluteFillObject), { backgroundColor: props.style.controlsBackgroundColor, opacity: 0.5 })} />
                <View style={{ width: Dimensions.get('window').width, justifyContent: 'space-between', flexDirection: 'row', top: 0, position: 'absolute', marginTop: 15 }}>
                    {playbackInstanceInfo.state !== PlaybackStates.Buffering && <Image source={
                        require('./img/left.png')
                    } style={{ height: 50, width: 50, marginLeft: 15 }} tintColor="white" />}
                </View>

                <View pointerEvents={controlsState === ControlStates.Visible ? 'auto' : 'none'}>
                    <View style={styles.iconWrapper}>
                        <View style={{ flexDirection: 'row', }}>
                            {playbackInstanceInfo.state !== PlaybackStates.Buffering && <Image source={
                                require('./img/backward.png')
                            } style={{ height: 40, width: 40, marginTop: 20, marginRight: 30 }} tintColor="white" />}

                            <TouchableButton onPress={togglePlay}>
                                <View>
                                    {playbackInstanceInfo.state === PlaybackStates.Buffering &&
                                        (props.icon.loading || <ActivityIndicator {...props.activityIndicator} size="large" />)}
                                    {playbackInstanceInfo.state === PlaybackStates.Playing && props.icon.pause}
                                    {playbackInstanceInfo.state === PlaybackStates.Paused && props.icon.play}
                                    {playbackInstanceInfo.state === PlaybackStates.Ended && props.icon.replay}
                                    {((playbackInstanceInfo.state === PlaybackStates.Ended && !props.icon.replay) ||
                                        (playbackInstanceInfo.state === PlaybackStates.Playing && !props.icon.pause) ||
                                        (playbackInstanceInfo.state === PlaybackStates.Paused &&
                                            !props.icon.pause)) && (
                                            <Image source={
                                                playbackInstanceInfo.state === PlaybackStates.Playing ?
                                                    require('./img/pause.png')
                                                    : require('./img/play.png')
                                            } style={{ height: 80, width: 80, }} tintColor="white" />
                                        )}
                                </View>
                            </TouchableButton>
                            {playbackInstanceInfo.state !== PlaybackStates.Buffering && <Pressable onPress={forward10}>
                                <Image source={require('./img/forward.png')} style={{ height: 40, width: 40, marginTop: 22, marginLeft: 30 }} tintColor="white" />
                            </Pressable>
                            }
                        </View>
                    </View>
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>

        <Animated.View style={[
            styles.bottomInfoWrapper,
            {
                opacity: controlsOpacity,
                marginBottom: 28
            },
        ]}>
            {props.timeVisible && (<Text style={[props.textStyle, styles.timeLeft]}>
                {getMinutesSecondsFromMilliseconds(playbackInstanceInfo.position)}
            </Text>)}
            {props.slider.visible && (<Slider {...sliderProps} style={[styles.slider, props.slider.style]} thumbTintColor="white" minimumTrackTintColor="white" maximumTrackTintColor="gray" value={playbackInstanceInfo.duration
                ? playbackInstanceInfo.position / playbackInstanceInfo.duration
                : 0} onSlidingStart={() => {
                    if (playbackInstanceInfo.state === PlaybackStates.Playing) {
                        togglePlay();
                        setPlaybackInstanceInfo(Object.assign(Object.assign({}, playbackInstanceInfo), { state: PlaybackStates.Paused }));
                    }
                }} onSlidingComplete={(e) => __awaiter(void 0, void 0, void 0, function* () {
                    const position = e * playbackInstanceInfo.duration;
                    if (playbackInstance) {
                        yield playbackInstance.setStatusAsync({
                            positionMillis: position,
                            shouldPlay: true,
                        });
                    }
                    setPlaybackInstanceInfo(Object.assign(Object.assign({}, playbackInstanceInfo), { position }));
                })} />)}
            {props.timeVisible && (<Text style={[props.textStyle, styles.timeRight]}>
                {getMinutesSecondsFromMilliseconds(playbackInstanceInfo.duration)}
            </Text>)}
            {props.fullscreen.visible && (<TouchableButton onPress={() => props.fullscreen.inFullscreen
                ? props.fullscreen.exitFullscreen()
                : props.fullscreen.enterFullscreen()}>
                <View>
                    {props.icon.fullscreen}
                    {props.icon.exitFullscreen}
                    {((!props.icon.fullscreen && props.fullscreen.inFullscreen) ||
                        (!props.icon.exitFullscreen && !props.fullscreen.inFullscreen)) && (<MaterialIcons name={props.fullscreen.inFullscreen ? 'fullscreen-exit' : 'fullscreen'} style={props.icon.style} size={props.icon.size / 2} color={props.icon.color} />)}
                </View>
            </TouchableButton>)}
        </Animated.View>
    </View>);
};
VideoPlayer.defaultProps = defaultProps;
export default VideoPlayer;
