// 정현수 바부

import React from 'react'
import Authentication from '../../util/Authentication/Authentication'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import AppLayout from "./components/Layout";
import io from 'socket.io-client'
import axios from "axios";

const API_URL = 'https://8081.test.pikodev.me'

export default class App extends React.Component {
    constructor(props) {
        super(props)
        this.Authentication = new Authentication()

        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        this.state = {
            finishedLoading: false,
            theme: 'light',
            isVisible: true,
            maps: []
        }
    }

    loadMaps() {
        return axios.get(`${API_URL}/requests`).then(res => {
            this.setState({maps: res.data})
        })
    }

    contextUpdate(context, delta) {
        if (delta.includes('theme')) {
            this.setState(() => {
                return {theme: context.theme}
            })
        }
    }

    visibilityChanged(isVisible) {
        this.setState(() => {
            return {
                isVisible
            }
        })
    }

    componentDidMount() {
        if (this.twitch) {
            this.twitch.onAuthorized((auth) => {
                this.Authentication.setToken(auth.token, auth.userId)
                if (!this.state.finishedLoading) {
                    console.log(auth.token)
                    axios.defaults.headers.Authorization = `Bearer ${auth.token}`
                    this.socket = io.connect(API_URL, {
                        query: {
                            auth: auth.token
                        },
                    })
                    this.loadMaps().then(() => {
                        this.setState(() => {
                            return {finishedLoading: true}
                        })
                    })
                }
            })

            this.twitch.listen('broadcast', (target, contentType, body) => {
                this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)
            })

            this.twitch.onVisibilityChanged((isVisible, _c) => {
                this.visibilityChanged(isVisible)
            })

            this.twitch.onContext((context, delta) => {
                this.contextUpdate(context, delta)
            })
        }
    }

    componentWillUnmount() {
        if (this.twitch) {
            this.twitch.unlisten('broadcast', () => console.log('successfully unlistened'))
        }
    }

    render() {
        if (this.state.finishedLoading && this.state.isVisible) {
            return (
                <div className="App">
                    <div className={this.state.theme === 'light' ? 'App-light' : 'App-dark'}>
                        <AppLayout>
                            <div className="container">
                                <div className="mt-4">
                                    <h2 className="text-center">현재 맵: ㅁㄴㅇㄻㄴㅇㄹ</h2>
                                </div>
                                <div className="mt-4">
                                    <h4>대기중인 추천맵 목록</h4>
                                    {JSON.stringify(this.state.maps)}
                                </div>
                            </div>
                        </AppLayout>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="App">
                </div>
            )
        }

    }
}