'use client'; // This page might use client-side state or effects later

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion"; // Import motion
import { Loader2 } from "lucide-react"; // Import Loader2

const ProfilePage = () => {
  // --- Placeholder Data ---
  // In a real app, fetch this data based on the logged-in user's session
  const [email, setEmail] = useState('user@example.com'); // Read-only display
  const [pseudonym, setPseudonym] = useState('MindfulUser');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // --- End Placeholder Data ---

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Basic validation for password change (if fields are filled)
    if (newPassword || confirmNewPassword) {
      if (newPassword !== confirmNewPassword) {
        setError('New passwords do not match.');
        setLoading(false);
        return;
      }
      if (newPassword.length < 6) { // Example minimum length
         setError('New password must be at least 6 characters long.');
         setLoading(false);
         return;
      }
    }

    // --- TODO: Implement API call to update profile ---
    console.log('Attempting to save profile changes:', { pseudonym, newPassword: newPassword ? '******' : '(not changed)' });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Placeholder: Simulate success or error
    const isSuccess = Math.random() > 0.2; // Simulate 80% success rate

    if (isSuccess) {
       setSuccessMessage('Profile updated successfully!');
       // Clear password fields after successful update
       setNewPassword('');
       setConfirmNewPassword('');
    } else {
       setError('Failed to update profile. Please try again.');
    }
    // --- End Placeholder ---

    setLoading(false);
  };

  return (
    // Remove AppLayout wrapper, adjust padding
    <div className="container mx-auto max-w-2xl py-8 px-4">
      {/* Animate Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Use themed Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground">User Profile</CardTitle>
            <CardDescription>View and update your account details.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveChanges}>
            <CardContent className="space-y-6 pt-4"> {/* Added pt-4 */}
              {/* Display Email (Read-only) - Use themed Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  disabled // Keep disabled style from theme
                  className="cursor-not-allowed" // Explicit cursor style
                />
                 <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              </div>

              {/* Edit Pseudonym - Use themed Input */}
              <div className="space-y-2">
                <Label htmlFor="pseudonym">Pseudonym</Label>
                <Input
                  id="pseudonym"
                  type="text"
                  placeholder="Your anonymous name"
                  value={pseudonym}
                  onChange={(e) => setPseudonym(e.target.value)}
                  // Removed custom bg class
                />
                 <p className="text-xs text-muted-foreground">This name may be displayed in community features.</p>
              </div>

              {/* Use themed border */}
              <hr className="my-6 border-border/60" />

              {/* Change Password Section */}
              <h3 className="text-lg font-medium text-foreground">Change Password</h3>
               <p className="text-sm text-muted-foreground mb-4">Leave these fields blank if you do not want to change your password.</p>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    {/* Use themed Input */}
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                     {/* Use themed Input */}
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
              </div>

               {/* Error/Success Messages - Use themed text colors */}
              {error && <p className="text-sm text-destructive pt-2">{error}</p>}
              {successMessage && <p className="text-sm text-green-600 dark:text-green-500 pt-2">{successMessage}</p>}

            </CardContent>
            <CardFooter>
              {/* Use themed Button with gradient */}
              <Button type="submit" variant="gradient" className="ml-auto" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                 ) : (
                  'Save Changes'
                 )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
