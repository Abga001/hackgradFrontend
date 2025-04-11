import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Fixed Font Awesome imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faGraduationCap, faBriefcase, faCode } from '@fortawesome/free-solid-svg-icons';
// GitHub icon comes from brands package
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
// Globe icon is in solid package
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:3000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setProfileData(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  if (isLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>Loading profile...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '10px 20px', backgroundColor: '#4e54c8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ padding: '15px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', marginBottom: '20px' }}>Profile not found.</div>
        <Link to="/dashboard" style={{ padding: '10px 20px', backgroundColor: '#4e54c8', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const defaultImage = 'https://via.placeholder.com/150';

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', padding: '30px', background: 'linear-gradient(135deg, #4e54c8, #8f94fb)', color: 'white' }}>
        <div style={{ marginRight: '30px' }}>
          <img 
            src={profileData.profileImage || defaultImage} 
            alt={profileData.username} 
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '2rem', margin: '0 0 5px 0' }}>{profileData.fullName || profileData.username}</h2>
          <p style={{ fontSize: '1rem', opacity: '0.8', margin: '0 0 10px 0' }}>@{profileData.username}</p>
          {profileData.areaOfExpertise && (
            <p style={{ fontSize: '1.2rem', margin: '0 0 20px 0' }}>{profileData.areaOfExpertise}</p>
          )}
          <button 
            onClick={handleEditProfile}
            style={{ padding: '8px 16px', backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer' }}
          >
            <FontAwesomeIcon icon={faEdit} /> Edit Profile
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '20px' }}>
        <div style={{ flex: 2, paddingRight: '30px' }}>
          {/* Bio Section */}
          {profileData.bio && (
            <section style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>About</h3>
              <p style={{ lineHeight: '1.6', color: '#555' }}>{profileData.bio}</p>
            </section>
          )}

          {/* Education Section */}
          {profileData.education && profileData.education.length > 0 && (
            <section style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>
                <FontAwesomeIcon icon={faGraduationCap} /> Education
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {profileData.education.map((edu, index) => (
                  <div key={index} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4e54c8' }}>
                    <h4 style={{ fontSize: '1.1rem', margin: '0 0 5px 0', color: '#333' }}>{edu.institution}</h4>
                    <p style={{ fontWeight: '500', margin: '0 0 5px 0', color: '#555' }}>{edu.degree} in {edu.fieldOfStudy}</p>
                    <p style={{ fontSize: '0.9rem', color: '#777', margin: '0 0 10px 0' }}>
                      {edu.startYear} - {edu.endYear || 'Present'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience Section */}
          {profileData.experience && profileData.experience.length > 0 && (
            <section style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>
                <FontAwesomeIcon icon={faBriefcase} /> Experience
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {profileData.experience.map((exp, index) => (
                  <div key={index} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4e54c8' }}>
                    <h4 style={{ fontSize: '1.1rem', margin: '0 0 5px 0', color: '#333' }}>{exp.position}</h4>
                    <p style={{ fontWeight: '500', margin: '0 0 5px 0', color: '#555' }}>{exp.company}</p>
                    <p style={{ fontSize: '0.9rem', color: '#777', margin: '0 0 10px 0' }}>
                      {exp.startDate 
                        ? new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                        : ''
                      } - {
                        exp.endDate
                          ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                          : 'Present'
                      }
                    </p>
                    {exp.description && (
                      <p style={{ margin: '10px 0 0 0', fontSize: '0.95rem', lineHeight: '1.5', color: '#666' }}>{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '30px' }}>
          {/* Skills Section */}
          {profileData.skills && profileData.skills.length > 0 && (
            <section style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profileData.skills.map((skill, index) => (
                  <span key={index} style={{ backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem', display: 'inline-block' }}>{skill}</span>
                ))}
              </div>
            </section>
          )}

          {/* Programming Languages Section */}
          {profileData.favoriteLanguages && profileData.favoriteLanguages.length > 0 && (
            <section style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>
                <FontAwesomeIcon icon={faCode} /> Languages
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profileData.favoriteLanguages.map((lang, index) => (
                  <span key={index} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem', display: 'inline-block' }}>{lang}</span>
                ))}
              </div>
            </section>
          )}

          {/* Social Links */}
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>Connect</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profileData.github && (
                <a 
                  href={profileData.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#f1f1f1', color: '#333', textDecoration: 'none', borderRadius: '5px' }}
                >
                  <FontAwesomeIcon icon={faGithub} /> GitHub
                </a>
              )}
              {profileData.linkedin && (
                <a 
                  href={profileData.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#f1f1f1', color: '#333', textDecoration: 'none', borderRadius: '5px' }}
                >
                  <FontAwesomeIcon icon={faLinkedin} /> LinkedIn
                </a>
              )}
              {profileData.portfolio && (
                <a 
                  href={profileData.portfolio} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#f1f1f1', color: '#333', textDecoration: 'none', borderRadius: '5px' }}
                >
                  <FontAwesomeIcon icon={faGlobe} /> Portfolio
                </a>
              )}
              {!profileData.github && !profileData.linkedin && !profileData.portfolio && (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No social links provided yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;