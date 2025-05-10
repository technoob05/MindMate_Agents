'use client';

export default function EmergencyFixPage() {
  // Use plain HTML and JavaScript to ensure it works regardless of UI framework issues
  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '600px',
      margin: '40px auto',
      border: '2px solid red',
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      <h1 style={{ color: 'red' }}>Emergency Authentication Fix</h1>
      
      <div style={{ marginTop: '20px' }}>
        <p>Current localStorage contents:</p>
        <pre id="output" style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '4px',
          maxHeight: '200px',
          overflow: 'auto',
          fontSize: '12px'
        }}>Loading...</pre>
      </div>
      
      <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
        <button 
          onClick={() => {
            try {
              // Create a proper user object
              const user = {
                id: 'emergency-' + Date.now(),
                email: 'emergency@example.com',
                pseudonym: 'Emergency User'
              };
              
              // Store it
              localStorage.setItem('user', JSON.stringify(user));
              localStorage.setItem('lastAuthTime', Date.now().toString());
              localStorage.removeItem('redirectCount');
              
              // Update display
              document.getElementById('output').innerText = JSON.stringify({
                user: user,
                status: 'Created emergency user successfully'
              }, null, 2);
            } catch (e) {
              document.getElementById('output').innerText = 'Error: ' + e.message;
            }
          }}
          style={{
            padding: '10px',
            backgroundColor: 'blue',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Create Emergency User
        </button>
        
        <button 
          onClick={() => {
            try {
              localStorage.clear();
              document.getElementById('output').innerText = 'All localStorage data cleared';
            } catch (e) {
              document.getElementById('output').innerText = 'Error: ' + e.message;
            }
          }}
          style={{
            padding: '10px',
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear All Data
        </button>
        
        <button 
          onClick={() => {
            window.location.href = '/';
          }}
          style={{
            padding: '10px',
            backgroundColor: 'green',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go To Home
        </button>
      </div>
      
      {/* Use onload in client component */}
      <div dangerouslySetInnerHTML={{ 
        __html: `
          <script>
            // Update localStorage display on load
            setTimeout(() => {
              try {
                const output = document.getElementById('output');
                if (output) {
                  const items = {};
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    items[key] = localStorage.getItem(key);
                  }
                  output.innerText = JSON.stringify(items, null, 2);
                }
              } catch (e) {
                console.error(e);
              }
            }, 100);
          </script>
        `
      }} />
    </div>
  );
} 