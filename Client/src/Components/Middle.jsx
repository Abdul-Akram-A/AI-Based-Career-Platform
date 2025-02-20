import React from 'react';
import Form from './SubComponents/Form';
import Logo from './SubComponents/Logo';
import './Middle.css';

const Middle = () => {
    return (
        <div className='main_1 mt-2 mb-3 container min-vh-80 d-flex justify-content-center align-items-center rounded-5'>
            <div className="row w-100">
                <div className="col-12 col-sm-12 col-md-4 pb-3 d-flex justify-content-center align-items-center inner">
                    <Logo />
                </div>
                <div className="col-xs-12 col-sm-12 col-md-8 pt-3 inner">
                    <Form />
                </div>
            </div>
        </div>
    );
}

export default Middle;
