import React from 'react'
import Header from '../Components/Header'
import Middle from '../Components/Middle'
import Subhead from '../Components/ConComp/Subhead'
const Home = () => {
    return (
        <div className='home min-vh-100'>
            <Header />
            <Subhead />
            <Middle />
        </div >
    )
}

export default Home