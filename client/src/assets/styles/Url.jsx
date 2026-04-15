import React from 'react';
import ProfilePicture from './ProfilePicture';

const App = () => {
  const profilePictures = [
    "https://randomuser.me/api/portraits/men/1.jpg",
    "https://randomuser.me/api/portraits/men/2.jpg",
    "https://randomuser.me/api/portraits/men/3.jpg",
    "https://randomuser.me/api/portraits/men/4.jpg",
    "https://randomuser.me/api/portraits/women/1.jpg",
    "https://randomuser.me/api/portraits/women/2.jpg",
    "https://randomuser.me/api/portraits/women/3.jpg",
    "https://randomuser.me/api/portraits/women/4.jpg",
    "https://randomuser.me/api/portraits/men/5.jpg",
    "https://randomuser.me/api/portraits/women/5.jpg",
    "https://randomuser.me/api/portraits/men/6.jpg",
    "https://randomuser.me/api/portraits/men/7.jpg",
    "https://randomuser.me/api/portraits/men/8.jpg",
    "https://randomuser.me/api/portraits/men/9.jpg",
    "https://randomuser.me/api/portraits/women/6.jpg",
    "https://randomuser.me/api/portraits/women/7.jpg",
    "https://randomuser.me/api/portraits/women/8.jpg",
    "https://randomuser.me/api/portraits/women/9.jpg",
    "https://randomuser.me/api/portraits/men/10.jpg",
    "https://randomuser.me/api/portraits/women/10.jpg",
    
    "https://randomuser.me/api/portraits/men/12.jpg",
    "https://randomuser.me/api/portraits/men/13.jpg",
    "https://randomuser.me/api/portraits/men/14.jpg",
    "https://randomuser.me/api/portraits/women/11.jpg",
    "https://randomuser.me/api/portraits/women/12.jpg",
    "https://randomuser.me/api/portraits/women/13.jpg",
    "https://randomuser.me/api/portraits/women/14.jpg",
    "https://randomuser.me/api/portraits/men/15.jpg",
    "https://randomuser.me/api/portraits/women/15.jpg",
    "https://randomuser.me/api/portraits/men/16.jpg",
    "https://randomuser.me/api/portraits/men/17.jpg",
    "https://randomuser.me/api/portraits/men/18.jpg",
    "https://randomuser.me/api/portraits/men/19.jpg",
    "https://randomuser.me/api/portraits/women/16.jpg",
    "https://randomuser.me/api/portraits/women/17.jpg",
    "https://randomuser.me/api/portraits/women/18.jpg",
    "https://randomuser.me/api/portraits/women/19.jpg",
    "https://randomuser.me/api/portraits/men/20.jpg",
    "https://randomuser.me/api/portraits/women/20.jpg",
    "https://randomuser.me/api/portraits/men/21.jpg",
    "https://randomuser.me/api/portraits/men/22.jpg",
    "https://randomuser.me/api/portraits/men/23.jpg",
    "https://randomuser.me/api/portraits/men/24.jpg",
    "https://randomuser.me/api/portraits/women/21.jpg",
    "https://randomuser.me/api/portraits/women/22.jpg",
    "https://randomuser.me/api/portraits/women/23.jpg",
    "https://randomuser.me/api/portraits/women/24.jpg", 
    "https://randomuser.me/api/portraits/men/25.jpg",
    "https://randomuser.me/api/portraits/women/25.jpg",
  ];

  return (
    <div>
      <h1>Profile Pictures</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {profilePictures.map((url, index) => (
          <ProfilePicture
            key={index}
            imageUrl={url}
            altText={`Profile picture ${index + 1}`}
            size="100px"
          />
        ))}
      </div>
    </div>
  );
};

export default App;
