import React, { useState } from "react";
import "./Form.css";
import { useDispatch, useSelector } from "react-redux";
import { updateField, resetForm } from "../../Slices/formSlice";
import { fetchJobData } from "../../Slices/jobSlice";
import { useNavigate } from "react-router-dom";
import { useFile } from "../Context/FileProvider";
const Form = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const formData = useSelector((state) => state.form);
    const { file, setFile } = useFile();
    const [error, setError] = useState(""); // Local state for error handling

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "resume") {
            setFile(files[0]);
            dispatch(updateField({ field: name, value: files[0]?.name || "" })); // Update metadata
        } else {
            dispatch(updateField({ field: name, value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file || !formData.frequency) {
            setError("Both resume and frequency are required.");
            return;
        }

        setError(""); // Clear previous errors

        console.log("Form data:", formData.frequency);
        console.log("File:", file);

        try {
            // Redirect to the content page
            navigate("/content");

            // Dispatch the async thunk to fetch job data
            dispatch(fetchJobData({ resumeFile: file, frequency: formData.frequency, location: formData.location }));
            // dispatch(resetForm());
        } catch (error) {
            console.error("Form submission error:", error);
            setError("Failed to submit. Please try again.");
        }
    };

    return (
        <form className="Form f-bg" onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}
            <div className="mb-3 text-xs-center w-100 f-bg">
                <label htmlFor="pdfFile" className="form-label f-bg">
                    Resume
                </label>
                <input
                    className="form-control rounded-pill"
                    name="resume"
                    onChange={handleChange}
                    type="file"
                    id="pdfFile"
                    accept=".pdf, .txt, .doc, .docx"
                    required
                />
            </div>
            <div className="mb-3 text-xs-center w-100 f-bg custom-field-con">
                <div className="w-prop-1">
                    <label htmlFor="freqIn" className="form-label f-bg">
                        Frequency
                    </label>
                    <input
                        className="form-control rounded-pill"
                        name="frequency"
                        onChange={handleChange}
                        value={formData.frequency}
                        type="number"
                        id="freqIn"
                        required
                    />
                </div>
                <div className="w-prop-2 lmb">
                    <label htmlFor="locIn" className="form-label f-bg">
                        Location (optional)
                    </label>
                    <input
                        className="form-control rounded-pill"
                        name="location"
                        onChange={handleChange}
                        value={formData.location}
                        type="text"
                        id="locIn"
                        required // check
                    />
                </div>

            </div>
            <input
                className="btn btn-primary rounded-pill px-5"
                type="submit"
                value="Go"
                disabled={!file || !formData.frequency} // Disable button if validation fails
            />
        </form>
    );
};

export default Form;
