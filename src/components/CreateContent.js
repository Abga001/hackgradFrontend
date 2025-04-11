import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../apiService";

const CreateContent = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [contentType, setContentType] = useState("Post");
  const [visibility, setVisibility] = useState("Public");
  const [extraFields, setExtraFields] = useState({});

  // Handle form input change dynamically
  const handleExtraFieldChange = (field, value) => {
    setExtraFields((prevFields) => ({
      ...prevFields,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await contentService.createContent({
        contentType,
        visibility,
        extraFields,
      });
      
      // Show success message
      alert("Content created successfully!");
      
      // Redirect to content list
      navigate("/contents");
    } catch (err) {
      console.error("Error creating content:", err);
      setError(err.message || "Failed to create content. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamically render input fields based on contentType
  const renderExtraFields = () => {
    switch (contentType) {
      case "Post":
        return (
          <>
            <div className="form-group">
              <label htmlFor="postTitle">Post Title</label>
              <input
                type="text"
                id="postTitle"
                onChange={(e) => handleExtraFieldChange("postTitle", e.target.value)}
                placeholder="Enter post title"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="postDescription">Post Description</label>
              <textarea
                id="postDescription"
                onChange={(e) => handleExtraFieldChange("postDescription", e.target.value)}
                placeholder="Enter post description"
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="postTags">Tags (comma separated)</label>
              <input
                type="text"
                id="postTags"
                onChange={(e) => handleExtraFieldChange("postTags", e.target.value)}
                placeholder="E.g., technology, programming, design"
              />
            </div>
            <div className="form-group">
              <label htmlFor="postImage">Image URL (optional)</label>
              <input
                type="url"
                id="postImage"
                onChange={(e) => handleExtraFieldChange("postImage", e.target.value)}
                placeholder="Enter image URL"
              />
            </div>
          </>
        );
        
      case "Job":
        return (
          <>
            <div className="form-group">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                type="text"
                id="jobTitle"
                onChange={(e) => handleExtraFieldChange("jobTitle", e.target.value)}
                placeholder="Enter job title"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="jobCompany">Company</label>
              <input
                type="text"
                id="jobCompany"
                onChange={(e) => handleExtraFieldChange("jobCompany", e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="jobDescription">Job Description</label>
              <textarea
                id="jobDescription"
                onChange={(e) => handleExtraFieldChange("jobDescription", e.target.value)}
                placeholder="Enter job description"
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="jobType">Job Type</label>
              <select
                id="jobType"
                onChange={(e) => handleExtraFieldChange("jobType", e.target.value)}
                defaultValue=""
                required
              >
                <option value="" disabled>Select job type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="jobLocation">Location</label>
              <input
                type="text"
                id="jobLocation"
                onChange={(e) => handleExtraFieldChange("jobLocation", e.target.value)}
                placeholder="Enter job location"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="jobSkillsRequired">Skills Required (comma separated)</label>
              <input
                type="text"
                id="jobSkillsRequired"
                onChange={(e) => handleExtraFieldChange("jobSkillsRequired", e.target.value)}
                placeholder="E.g., JavaScript, React, Node.js"
              />
            </div>
            <div className="form-group">
              <label htmlFor="jobLink">Application Link</label>
              <input
                type="url"
                id="jobLink"
                onChange={(e) => handleExtraFieldChange("jobLink", e.target.value)}
                placeholder="Enter application URL"
              />
            </div>
          </>
        );
        
      case "Event":
        return (
          <>
            <div className="form-group">
              <label htmlFor="eventTitle">Event Title</label>
              <input
                type="text"
                id="eventTitle"
                onChange={(e) => handleExtraFieldChange("eventTitle", e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="eventType">Event Type</label>
              <select
                id="eventType"
                onChange={(e) => handleExtraFieldChange("eventType", e.target.value)}
                defaultValue=""
                required
              >
                <option value="" disabled>Select event type</option>
                <option value="Webinar">Webinar</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Meetup">Meetup</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="eventDate">Date</label>
              <input
                type="date"
                id="eventDate"
                onChange={(e) => handleExtraFieldChange("eventDate", e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="eventTime">Time</label>
              <input
                type="time"
                id="eventTime"
                onChange={(e) => handleExtraFieldChange("eventTime", e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="eventLocation">Location</label>
              <input
                type="text"
                id="eventLocation"
                onChange={(e) => handleExtraFieldChange("eventLocation", e.target.value)}
                placeholder="Enter event location or 'Virtual'"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="eventLink">Event Link</label>
              <input
                type="url"
                id="eventLink"
                onChange={(e) => handleExtraFieldChange("eventLink", e.target.value)}
                placeholder="Enter event registration URL"
              />
            </div>
            <div className="form-group">
              <label htmlFor="eventMaxParticipants">Maximum Participants</label>
              <input
                type="number"
                id="eventMaxParticipants"
                onChange={(e) => handleExtraFieldChange("eventMaxParticipants", parseInt(e.target.value, 10))}
                placeholder="Enter maximum participants (leave empty if unlimited)"
                min="1"
              />
            </div>
          </>
        );
        
      case "Project":
        return (
          <>
            <div className="form-group">
              <label htmlFor="projectTitle">Project Title</label>
              <input
                type="text"
                id="projectTitle"
                onChange={(e) => handleExtraFieldChange("projectTitle", e.target.value)}
                placeholder="Enter project title"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectDescription">Project Description</label>
              <textarea
                id="projectDescription"
                onChange={(e) => handleExtraFieldChange("projectDescription", e.target.value)}
                placeholder="Enter project description"
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectTechnologiesUsed">Technologies Used (comma separated)</label>
              <input
                type="text"
                id="projectTechnologiesUsed"
                onChange={(e) => handleExtraFieldChange("projectTechnologiesUsed", e.target.value)}
                placeholder="E.g., React, Node.js, MongoDB"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectRepoLink">Repository Link</label>
              <input
                type="url"
                id="projectRepoLink"
                onChange={(e) => handleExtraFieldChange("projectRepoLink", e.target.value)}
                placeholder="Enter repository URL"
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectDemoLink">Demo Link</label>
              <input
                type="url"
                id="projectDemoLink"
                onChange={(e) => handleExtraFieldChange("projectDemoLink", e.target.value)}
                placeholder="Enter demo URL"
              />
            </div>
          </>
        );
        
      case "Tutorial":
        return (
          <>
            <div className="form-group">
              <label htmlFor="tutorialTitle">Tutorial Title</label>
              <input
                type="text"
                id="tutorialTitle"
                onChange={(e) => handleExtraFieldChange("tutorialTitle", e.target.value)}
                placeholder="Enter tutorial title"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="tutorialCategory">Category</label>
              <input
                type="text"
                id="tutorialCategory"
                onChange={(e) => handleExtraFieldChange("tutorialCategory", e.target.value)}
                placeholder="Enter tutorial category"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="tutorialDescription">Description</label>
              <textarea
                id="tutorialDescription"
                onChange={(e) => handleExtraFieldChange("tutorialDescription", e.target.value)}
                placeholder="Enter tutorial description"
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="tutorialDifficultyLevel">Difficulty Level</label>
              <select
                id="tutorialDifficultyLevel"
                onChange={(e) => handleExtraFieldChange("tutorialDifficultyLevel", e.target.value)}
                defaultValue=""
                required
              >
                <option value="" disabled>Select difficulty level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="tutorialLink">Tutorial Link</label>
              <input
                type="url"
                id="tutorialLink"
                onChange={(e) => handleExtraFieldChange("tutorialLink", e.target.value)}
                placeholder="Enter tutorial URL"
              />
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="create-content-container">
      <h2>Create Content</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="contentType">Content Type</label>
          <select
            id="contentType"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            required
          >
            <option value="Post">Post</option>
            <option value="Job">Job</option>
            <option value="Event">Event</option>
            <option value="Project">Project</option>
            <option value="Tutorial">Tutorial</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="visibility">Visibility</label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            required
          >
            <option value="Public">Public</option>
            <option value="Connections">Connections Only</option>
            <option value="Private">Private</option>
          </select>
        </div>

        {/* Render dynamic fields based on content type */}
        {renderExtraFields()}

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate("/contents")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Content"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateContent;