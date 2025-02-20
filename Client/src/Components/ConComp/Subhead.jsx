import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import "./Subhead.css";
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { removeCategory } from '../../Slices/jobSlice';

const Subhead = () => {
    const { jobData, category } = useSelector((state) => state.jobData);
    const navigate = useNavigate();
    const location = useLocation();
    // const dispatch = useDispatch();
    const handleBack = () => {
        navigate('/');
        // dispatch(removeCategory())
    }

    const handleResult = () => {
        navigate('/content');
    }

    let content = null;

    if (jobData.length !== 0 && location.pathname === "/") {
        content = (
            <>
                <button
                    onClick={handleResult}
                    className="btn btn-success cus-btn rounded-pill p-1 px-sm-4 py-sm-2 text-white shadow-sm text-decoration-none"
                >
                    Result
                </button>
            </>
        )
    } else if (location.pathname === "/content") {
        content = (
            <>
                <button
                    onClick={handleBack}
                    className="btn btn-danger rounded-pill cus-btn p-1 px-sm-4 py-sm-2 text-white shadow-sm text-decoration-none"
                >
                    Back
                </button>
            </>
        )
    }

    return (
        <div className="subhead">
            {content}
            {category && <h4 className="text-break">Role: {category}</h4>}
        </div>
    );

};

export default Subhead;
