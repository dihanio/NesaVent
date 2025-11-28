'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PendingUser {
  _id: string;
  nama: string;
  email: string;
  nim?: string;
  programStudi?: string;
  fakultas?: string;
  ktm?: string;
  studentVerificationStatus: 'unverified' | 'pending' | 'approved' | 'rejected';
  studentVerificationNote?: string;
  createdAt: string;
}

export default function AdminStudentVerificationsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated() || !authService.isAdmin()) {
      window.location.href = '/login';
      return;
    }
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      const response = await api.get('/admin/student-verifications');
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !action) return;

    setProcessing(true);
    try {
      const endpoint = action === 'approve'
        ? `/admin/student-verifications/${selectedUser._id}/approve`
        : `/admin/student-verifications/${selectedUser._id}/reject`;

      await api.put(endpoint, { note: note.trim() || undefined });

      // Update local state
      setPendingUsers(prev => prev.filter(user => user._id !== selectedUser._id));

      alert(`Verifikasi mahasiswa ${action === 'approve' ? 'disetujui' : 'ditolak'} berhasil!`);
      setSelectedUser(null);
      setAction(null);
      setNote('');
    } catch (error: any) {
      console.error('Error processing verification:', error);
      alert(error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Verifikasi Mahasiswa</h1>
          <p className="text-gray-600">Kelola permintaan verifikasi status mahasiswa</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permintaan Verifikasi Pending</CardTitle>
            <CardDescription>
              Daftar mahasiswa yang mengajukan verifikasi status mahasiswa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada permintaan pending</h3>
                <p className="mt-1 text-sm text-gray-500">Semua permintaan verifikasi telah diproses.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={user.ktm ? `/uploads/ktm/${user.ktm}` : undefined} />
                        <AvatarFallback>{user.nama.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{user.nama}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm">NIM: {user.nim || 'Tidak ada'}</span>
                          <span className="text-sm">Prodi: {user.programStudi || 'Tidak ada'}</span>
                          <span className="text-sm">Fakultas: {user.fakultas || 'Tidak ada'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setAction('approve');
                              setNote('Verifikasi mahasiswa disetujui');
                            }}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Setujui
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Setujui Verifikasi Mahasiswa</DialogTitle>
                            <DialogDescription>
                              Apakah Anda yakin ingin menyetujui verifikasi mahasiswa untuk {selectedUser?.nama}?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Catatan (opsional)</label>
                              <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Tambahkan catatan untuk mahasiswa..."
                                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedUser(null)}>
                              Batal
                            </Button>
                            <Button onClick={handleAction} disabled={processing}>
                              {processing ? 'Memproses...' : 'Setujui'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setAction('reject');
                              setNote('');
                            }}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Tolak
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Tolak Verifikasi Mahasiswa</DialogTitle>
                            <DialogDescription>
                              Berikan alasan penolakan verifikasi untuk {selectedUser?.nama}.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Alasan Penolakan <span className="text-red-500">*</span></label>
                              <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Jelaskan alasan penolakan..."
                                rows={3}
                                required
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedUser(null)}>
                              Batal
                            </Button>
                            <Button variant="destructive" onClick={handleAction} disabled={processing || !note.trim()}>
                              {processing ? 'Memproses...' : 'Tolak'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}