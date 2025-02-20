import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchJobData, getJobData } from "../../Slices/jobSlice";
import * as XLSX from "xlsx";
import "./Table.css";

const Table = () => {
    const dispatch = useDispatch();
    const { jobData, status, error } = useSelector((state) => state.jobData);

    // Load job data from sessionStorage on mount
    useEffect(() => {
        const savedData = sessionStorage.getItem("jobData");
        console.log(sessionStorage.getItem("jobData"))
        if (savedData) {
            dispatch(getJobData(JSON.parse(savedData))); // Load persisted data
        }
    }, [dispatch]);

    // Download file
    const downloadExcel = () => {
        // Define the headers in a specific order
        const headers = ["ID", "Title", "Company Name", "Location", "Link"];

        // Convert object data to a 2D array in the desired order
        const rows = jobData.map(row => [row.id, row.title, row.company_name, row.location, row.link]);
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);//to preserve order
        // const worksheet = XLSX.utils.json_to_sheet(jobData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Jobs");

        XLSX.writeFile(workbook, "JobListings_data.xlsx");
    };

    if (status === "loading") {
        return <div className="content-con container rounded-5"><p className="text-light">Loading job data...</p></div>;
    }

    if (status === "failed") {
        return <div className="content-con container rounded-5"><p className="text-light">Error: {error}</p></div>;
    }

    if (!Array.isArray(jobData) || jobData.length === 0) {
        return <div className="content-con container rounded-5"><p className="text-light">No job data available</p></div>;
    }

    return (
        <div className="container mt-3">
            <div className="card shadow-lg">
                <div className="card-header bg-dark text-white d-flex justify-content-between">
                    <h3 className="mb-0 bg-dark">Job Listings</h3>
                    <button onClick={downloadExcel} className="btn btn-primary rounded-pill p-1 px-sm-4 py-sm-2 text-white shadow-sm text-decoration-none">
                        Download
                    </button>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-striped table-hover table-dark mb-1">
                            <thead className="thead-light">
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Title</th>
                                    <th scope="col">Company</th>
                                    <th scope="col">Location</th>
                                    <th scope="col">Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobData.map((data) => (
                                    <tr key={data.id || Math.random()}>
                                        <th scope="row">{data.id || "N/A"}</th>
                                        <td>{data.title || "N/A"}</td>
                                        <td>{data.company_name || "N/A"}</td>
                                        <td>{data.location || "N/A"}</td>
                                        <td>
                                            {data.link ? (
                                                <a href={data.link} className="text-white text-decoration-none btn btn-outline-success" target="_blank" rel="noreferrer">
                                                    View Job
                                                </a>
                                            ) : (
                                                <span className="text-muted">N/A</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer text-muted text-center">
                    Showing {jobData.length || 0} jobs
                </div>
            </div>
        </div>
    );
};

export default Table;
