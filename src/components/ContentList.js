import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { contentService } from "../apiService";

const ContentList = () => {
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await contentService.getAllContents();
      setContents(data || []);
    } catch (err) {
      console.error("Error fetching contents:", err);
      setError("Failed to load content. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this content?")) {
      return;
    }
    
    try {
      await contentService.deleteContent(id);
      setContents(contents.filter(content => content._id !== id));
      setSelectedContent(null);
    } catch (err) {
      console.error("Error deleting content:", err);
      alert("Failed to delete content. Please try again.");
    }
  };

  const handleLike = async (id) => {
    try {
      await contentService.likeContent(id);
      fetchContents(); // Refresh content after like
    } catch (err) {
      console.error("Error liking content:", err);
    }
  };

  const handleFilter = (filter) => {
    setActiveFilter(filter);
  };

  const filteredContents = activeFilter === "All"
    ? contents
    : contents.filter(content => content.contentType === activeFilter);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getContentTitle = (content) => {
    return content.extraFields.postTitle || 
           content.extraFields.jobTitle || 
           content.extraFields.eventTitle || 
           content.extraFields.projectTitle || 
           content.extraFields.tutorialTitle || 
           `${content.contentType} (No Title)`;
  };

  return (
    <div className="content-list-container">
      <div className="header-with-action">
        <h2>Content List</h2>
        <Link to="/create" className="create-btn">Create New Content</Link>
      </div>
      
      {isLoading && <p>Loading content...</p>}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchContents}>Try Again</button>
        </div>
      )}
      
      {!isLoading && !error && (
        <>
          <div className="content-filters">
            <button 
              className={activeFilter === "All" ? "active" : ""}
              onClick={() => handleFilter("All")}
            >
              All
            </button>
            <button 
              className={activeFilter === "Post" ? "active" : ""}
              onClick={() => handleFilter("Post")}
            >
              Posts
            </button>
            <button 
              className={activeFilter === "Job" ? "active" : ""}
              onClick={() => handleFilter("Job")}
            >
              Jobs
            </button>
            <button 
              className={activeFilter === "Event" ? "active" : ""}
              onClick={() => handleFilter("Event")}
            >
              Events
            </button>
            <button 
              className={activeFilter === "Project" ? "active" : ""}
              onClick={() => handleFilter("Project")}
            >
              Projects
            </button>
            <button 
              className={activeFilter === "Tutorial" ? "active" : ""}
              onClick={() => handleFilter("Tutorial")}
            >
              Tutorials
            </button>
          </div>
          
          {filteredContents.length === 0 ? (
            <p>No content available in this category.</p>
          ) : (
            <div className="content-grid">
              {filteredContents.map((content) => (
                <div 
                  key={content._id} 
                  className={`content-card ${selectedContent?._id === content._id ? 'selected' : ''}`}
                  onClick={() => setSelectedContent(content)}
                >
                  <div className="content-type-badge" data-type={content.contentType.toLowerCase()}>
                    {content.contentType}
                  </div>
                  
                  <h3>{getContentTitle(content)}</h3>
                  
                  <div className="content-meta">
                    <p>Created: {formatDate(content.createdAt)}</p>
                    <p>Last Updated: {formatDate(content.lastUpdatedAt)}</p>
                  </div>
                  
                  <div className="content-stats">
                    <span><i className="fa fa-thumbs-up"></i> {content.likes.length}</span>
                    <span><i className="fa fa-comment"></i> {content.comments.length}</span>
                    <span><i className="fa fa-eye"></i> {content.visibility}</span>
                  </div>
                  
                  <div className="content-actions">
                    <button 
                      className="action-btn like-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(content._id);
                      }}
                    >
                      Like
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(content._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedContent && (
            <div className="content-details-modal">
              <div className="modal-header">
                <h3>{getContentTitle(selectedContent)}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedContent(null)}
                >
                  &times;
                </button>
              </div>
              
              <div className="modal-body">
                <div className="content-info">
                  <p><strong>Type:</strong> {selectedContent.contentType}</p>
                  <p><strong>Created:</strong> {formatDate(selectedContent.createdAt)}</p>
                  <p><strong>Last Updated:</strong> {formatDate(selectedContent.lastUpdatedAt)}</p>
                  <p><strong>Visibility:</strong> {selectedContent.visibility}</p>
                  <p><strong>Likes:</strong> {selectedContent.likes.length}</p>
                </div>
                
                <div className="content-fields">
                  <h4>Content Details</h4>
                  {Object.entries(selectedContent.extraFields).map(([key, value]) => (
                    <div key={key} className="field-item">
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </div>
                
                <div className="content-comments">
                  <h4>Comments ({selectedContent.comments.length})</h4>
                  {selectedContent.comments.length === 0 ? (
                    <p>No comments yet.</p>
                  ) : (
                    <ul className="comments-list">
                      {selectedContent.comments.map((comment, index) => (
                        <li key={index} className="comment-item">
                          <p className="comment-text">{comment.text}</p>
                          <p className="comment-date">
                            {formatDate(comment.createdAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(selectedContent._id)}
                >
                  Delete
                </button>
                <button 
                  className="action-btn"
                  onClick={() => setSelectedContent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContentList;