'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  _id: string;
  nama: string;
  email: string;
  nomorTelepon?: string;
  role: 'user' | 'mahasiswa' | 'mitra' | 'admin';
  avatar?: string;
  coverImage?: string;
  themeColor?: string;
  organisasi?: string;
  deskripsiOrganisasi?: string;
  instagram?: string;
  website?: string;
  nim?: string;
  programStudi?: string;
  fakultas?: string;
  ktm?: string;
  studentVerificationStatus?: 'unverified' | 'pending' | 'approved' | 'rejected';
  studentVerificationNote?: string;
  isStudentVerified?: boolean; // Backward compatibility
  createdAt: string;
}

interface Fakultas {
  _id: string;
  nama: string;
}

interface ProgramStudi {
  _id: string;
  nama: string;
  fakultas: {
    _id: string;
    nama: string;
  };
}

interface Tab {
  id: string;
  name: string;
  icon: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fakultas, setFakultas] = useState<Fakultas[]>([]);
  const [programStudi, setProgramStudi] = useState<ProgramStudi[]>([]);
  const [selectedFakultas, setSelectedFakultas] = useState<string>('');
  const [isEditingStudentInfo, setIsEditingStudentInfo] = useState(false);
  const [ktmFile, setKtmFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  // Check if student info is complete
  const isStudentInfoComplete = !!(profile?.nim && profile?.programStudi && profile?.fakultas);

  // Check if verification is pending or can be submitted
  const canSubmitVerification = isStudentInfoComplete && (
    profile?.studentVerificationStatus === 'unverified' ||
    profile?.studentVerificationStatus === 'rejected' ||
    profile?.studentVerificationStatus === 'pending'
  );

  // Check if KTM is required for submission
  const isKtmRequired = profile?.studentVerificationStatus === 'unverified' || profile?.studentVerificationStatus === 'rejected';

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchUser();
    fetchProfile();
    fetchFakultas();
    fetchProgramStudi();
  }, []);

  // Filter program studi berdasarkan fakultas yang dipilih
  const filteredProgramStudi = selectedFakultas
    ? programStudi.filter(prodi => prodi.fakultas._id === selectedFakultas)
    : [];

  // Set selectedFakultas ketika profile dimuat
  useEffect(() => {
    if (profile?.fakultas && fakultas.length > 0) {
      const fakultasObj = fakultas.find(f => f.nama === profile.fakultas);
      if (fakultasObj) {
        setSelectedFakultas(fakultasObj._id);
      }
    }
  }, [profile, fakultas]);

  const handleFakultasChange = (fakultasId: string) => {
    setSelectedFakultas(fakultasId);
    const fakultasObj = fakultas.find(f => f._id === fakultasId);
    if (fakultasObj) {
      handleInputChange('fakultas', fakultasObj.nama);
      // Reset program studi jika fakultas berubah
      if (profile?.programStudi) {
        const currentProdi = programStudi.find(p => p.nama === profile.programStudi);
        if (currentProdi && currentProdi.fakultas._id !== fakultasId) {
          handleInputChange('programStudi', '');
        }
      }
    }
  };

  const fetchUser = async () => {
    try {
      const userData = authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFakultas = async () => {
    try {
      const response = await api.get('/academic/fakultas');
      setFakultas(response.data);
    } catch (error) {
      console.error('Error fetching fakultas:', error);
    }
  };

  const fetchProgramStudi = async () => {
    try {
      const response = await api.get('/academic/program-studi');
      setProgramStudi(response.data);
    } catch (error) {
      console.error('Error fetching program studi:', error);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // If updating student info, validate KTM upload only for unverified/rejected status
      if (isEditingStudentInfo && isKtmRequired && !ktmFile) {
        alert('Foto KTM wajib dilampirkan untuk verifikasi data mahasiswa');
        setSaving(false);
        return;
      }

      // If updating student info and already approved, prevent update
      if (isEditingStudentInfo && profile?.studentVerificationStatus === 'approved') {
        alert('Data mahasiswa sudah terverifikasi. Tidak dapat diubah.');
        setSaving(false);
        return;
      }

      console.log('Sending profile data:', profile);

      // Create FormData for file upload if KTM is included
      let requestData: any = profile;
      if (isEditingStudentInfo && ktmFile) {
        const formData = new FormData();
        Object.keys(profile!).forEach(key => {
          if (profile![key as keyof UserProfile] !== null && profile![key as keyof UserProfile] !== undefined) {
            formData.append(key, profile![key as keyof UserProfile] as string);
          }
        });
        formData.append('ktm', ktmFile);
        requestData = formData;
      }

      const response = await api.put('/auth/profile', requestData, {
        headers: isEditingStudentInfo && ktmFile ? { 'Content-Type': 'multipart/form-data' } : undefined
      });

      console.log('Response from server:', response.data);
      setProfile(response.data);
      setIsEditingStudentInfo(false);
      setKtmFile(null);
      alert('Profil berhasil diperbarui!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handleKtmFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }
      setKtmFile(file);
    }
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }
    // Validate file size (max 5MB for cover)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    setCoverImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadCoverImage = async () => {
    if (!coverImageFile) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('coverImage', coverImageFile);

      const response = await api.put('/auth/profile/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProfile(response.data);
      setCoverImageFile(null);
      setCoverImagePreview(null);
      alert('Cover image berhasil diperbarui!');
    } catch (error: any) {
      console.error('Error uploading cover image:', error);
      alert(error.response?.data?.message || 'Gagal mengupload cover image');
    } finally {
      setSaving(false);
    }
  };

  const startEditingStudentInfo = () => {
    // Allow editing if info is incomplete OR if complete but not verified (needs KTM)
    if (isStudentInfoComplete && profile?.isStudentVerified) {
      alert('Informasi mahasiswa sudah lengkap dan terverifikasi. Tidak dapat diubah.');
      return;
    }
    setIsEditingStudentInfo(true);
  };

  const cancelEditingStudentInfo = () => {
    setIsEditingStudentInfo(false);
    setKtmFile(null);
    // Reset form to original values
    fetchProfile();
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat profil...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Gagal memuat profil</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-yellow-50 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 mb-4 md:mb-6 lg:mb-8 border-2 border-blue-100">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <svg className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-600">Profil</h1>
          </div>
          <p className="text-gray-600 text-xs md:text-sm lg:text-base ml-0 md:ml-14 lg:ml-15">Kelola informasi profil dan identitas Anda</p>
        </div>

        <form onSubmit={updateProfile}>
          <div className="space-y-4 md:space-y-6">
              {/* General Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Umum</CardTitle>
                  <CardDescription>Informasi dasar akun Anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-3 md:gap-4">
                    <Avatar className="w-16 h-16 md:w-20 md:h-20 shrink-0">
                      <AvatarImage src={profile.avatar} alt={profile.nama} />
                      <AvatarFallback className="text-base md:text-lg">
                        {profile.nama.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button type="button" variant="outline" size="sm" className="text-xs md:text-sm">
                        Ubah Foto
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG hingga 2MB</p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div>
                    <Label>Role</Label>
                    <div className="mt-1">
                      <Badge variant={profile.role === 'admin' ? 'destructive' : profile.role === 'mitra' ? 'default' : 'secondary'}>
                        {profile.role === 'admin' ? 'Admin' : profile.role === 'mitra' ? 'Mitra' : profile.role === 'mahasiswa' ? 'Mahasiswa' : 'User'}
                      </Badge>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={profile.nama}
                      onChange={(e) => handleInputChange('nama', e.target.value)}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="nomorTelepon">Nomor Telepon</Label>
                    <Input
                      id="nomorTelepon"
                      value={profile.nomorTelepon || ''}
                      onChange={(e) => handleInputChange('nomorTelepon', e.target.value)}
                      placeholder="Contoh: 081234567890"
                    />
                </div>
              </CardContent>
            </Card>

            {/* Organization Information - Only for Mitra */}
            {profile.role === 'mitra' && (
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Organisasi</CardTitle>
                  <CardDescription>Informasi tentang organisasi Anda yang akan ditampilkan di halaman publik</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Cover Image Upload */}
                  <div className="space-y-3">
                    <Label>Cover Image (Banner)</Label>
                    <div className="rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                      {/* Cover Preview */}
                      <div className="relative h-48 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600">
                        {coverImagePreview || profile.coverImage ? (
                          <img
                            src={coverImagePreview || profile.coverImage}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 text-6xl">
                            🎭
                          </div>
                        )}
                      </div>
                      
                      {/* Upload Controls */}
                      <div className="p-4 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            id="coverImage"
                            accept="image/*"
                            onChange={handleCoverImageChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('coverImage')?.click()}
                          >
                            {profile.coverImage ? 'Ganti Cover' : 'Upload Cover'}
                          </Button>
                          {coverImageFile && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={uploadCoverImage}
                              disabled={saving}
                            >
                              {saving ? 'Uploading...' : 'Simpan Cover'}
                            </Button>
                          )}
                          {coverImageFile && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCoverImageFile(null);
                                setCoverImagePreview(null);
                              }}
                            >
                              Batal
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          JPG atau PNG, maksimal 5MB. Ukuran yang disarankan: 1200x400 piksel
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Organization Name */}
                  <div>
                    <Label htmlFor="organisasi">Nama Organisasi</Label>
                    <Input
                      id="organisasi"
                      value={profile.organisasi || ''}
                      onChange={(e) => handleInputChange('organisasi', e.target.value)}
                      placeholder="Contoh: UKM Basket Universitas Indonesia"
                    />
                  </div>

                  {/* Organization Description */}
                  <div>
                    <Label htmlFor="deskripsiOrganisasi">Deskripsi Organisasi</Label>
                    <Textarea
                      id="deskripsiOrganisasi"
                      value={profile.deskripsiOrganisasi || ''}
                      onChange={(e) => handleInputChange('deskripsiOrganisasi', e.target.value)}
                      placeholder="Jelaskan tentang organisasi Anda..."
                      rows={4}
                    />
                  </div>

                  {/* Theme Color Picker */}
                  <div>
                    <Label htmlFor="themeColor">Warna Tema Profil</Label>
                    <Select 
                      value={profile.themeColor || 'blue'} 
                      onValueChange={(value) => handleInputChange('themeColor', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih warna tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">🔵 Blue</SelectItem>
                        <SelectItem value="indigo">🟣 Indigo</SelectItem>
                        <SelectItem value="purple">💜 Purple</SelectItem>
                        <SelectItem value="pink">🌸 Pink</SelectItem>
                        <SelectItem value="red">🔴 Red</SelectItem>
                        <SelectItem value="orange">🟠 Orange</SelectItem>
                        <SelectItem value="yellow">🟡 Yellow</SelectItem>
                        <SelectItem value="green">🟢 Green</SelectItem>
                        <SelectItem value="teal">🩵 Teal</SelectItem>
                        <SelectItem value="cyan">💠 Cyan</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Warna tema akan diterapkan pada banner, avatar, dan tombol di profil publik Anda
                    </p>
                  </div>

                  <Separator />

                  {/* Social Media */}
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={profile.instagram || ''}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      placeholder="Contoh: @nesaevent"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="Contoh: https://nesaevent.com"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student Information - Only for Mahasiswa/User */}
            {(profile.role === 'user' || profile.role === 'mahasiswa') && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                    <div>
                      <CardTitle className="text-base md:text-lg">Informasi Mahasiswa</CardTitle>
                      <CardDescription className="text-xs md:text-sm mt-1">
                        {profile.studentVerificationStatus === 'approved'
                          ? 'Informasi akademik Anda sudah terverifikasi.'
                          : profile.studentVerificationStatus === 'pending'
                          ? 'Data Anda sedang dalam proses verifikasi oleh admin.'
                          : profile.studentVerificationStatus === 'rejected'
                          ? 'Verifikasi mahasiswa Anda ditolak. Silakan perbaiki data dan upload ulang.'
                          : 'Informasi akademik Anda sebagai mahasiswa'
                        }
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      {/* Status Verifikasi */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs md:text-sm text-gray-600 shrink-0">Status:</span>
                        <Badge className="text-xs" variant={
                          profile.studentVerificationStatus === 'approved' ? 'default' :
                          profile.studentVerificationStatus === 'pending' ? 'secondary' :
                          profile.studentVerificationStatus === 'rejected' ? 'destructive' : 'outline'
                        }>
                          {profile.studentVerificationStatus === 'approved' ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Terverifikasi
                            </>
                          ) : profile.studentVerificationStatus === 'pending' ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Menunggu Verifikasi
                            </>
                          ) : profile.studentVerificationStatus === 'rejected' ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Ditolak
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Belum Terverifikasi
                            </>
                          )}
                        </Badge>
                      </div>

                      {/* Verification Note */}
                      {profile.studentVerificationNote && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                          <span className="text-xs md:text-sm text-gray-600 shrink-0">Catatan:</span>
                          <span className={`text-xs md:text-sm ${profile.studentVerificationStatus === 'rejected' ? 'text-red-600' : 'text-green-600'}`}>
                            {profile.studentVerificationNote}
                          </span>
                        </div>
                      )}

                      {profile?.studentVerificationStatus !== 'approved' && !isEditingStudentInfo && (
                        <Button onClick={startEditingStudentInfo} variant="outline" size="sm" className="w-full sm:w-auto text-xs md:text-sm">
                          <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {!isStudentInfoComplete ? 'Lengkapi Data' : isKtmRequired ? 'Upload KTM' : 'Update Data'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* NIM */}
                  <div>
                    <Label htmlFor="nim">NIM (Nomor Induk Mahasiswa)</Label>
                    <Input
                      id="nim"
                      value={profile.nim || ''}
                      onChange={(e) => handleInputChange('nim', e.target.value)}
                      placeholder="Contoh: 12345678901"
                      maxLength={11}
                      disabled={!isEditingStudentInfo || profile?.studentVerificationStatus === 'approved'}
                    />
                  </div>

                  {/* Fakultas */}
                  <div>
                    <Label htmlFor="fakultas">Fakultas</Label>
                    <Select
                      value={selectedFakultas}
                      onValueChange={handleFakultasChange}
                      disabled={!isEditingStudentInfo || profile?.studentVerificationStatus === 'approved'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Fakultas" />
                      </SelectTrigger>
                      <SelectContent>
                        {fakultas.map((fak) => (
                          <SelectItem key={fak._id} value={fak._id}>
                            {fak.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Program Studi */}
                  <div>
                    <Label htmlFor="programStudi">Program Studi</Label>
                    <Select
                      value={profile.programStudi || ''}
                      onValueChange={(value) => handleInputChange('programStudi', value)}
                      disabled={!selectedFakultas || !isEditingStudentInfo || profile?.studentVerificationStatus === 'approved'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedFakultas ? "Pilih Program Studi" : "Pilih Fakultas terlebih dahulu"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProgramStudi.map((prodi) => (
                          <SelectItem key={prodi._id} value={prodi.nama}>
                            {prodi.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* KTM Status - Show if already uploaded */}
                  {profile.ktm && (
                    <div>
                      <Label>Status KTM</Label>
                      <div className={`flex items-center gap-2 p-3 border rounded-md ${
                        profile.studentVerificationStatus === 'approved'
                          ? 'bg-green-50 border-green-200'
                          : profile.studentVerificationStatus === 'pending'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          profile.studentVerificationStatus === 'approved'
                            ? 'text-green-600'
                            : profile.studentVerificationStatus === 'pending'
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`text-sm ${
                          profile.studentVerificationStatus === 'approved'
                            ? 'text-green-700'
                            : profile.studentVerificationStatus === 'pending'
                            ? 'text-yellow-700'
                            : 'text-gray-700'
                        }`}>
                          {profile.studentVerificationStatus === 'approved'
                            ? 'KTM telah diverifikasi'
                            : profile.studentVerificationStatus === 'pending'
                            ? 'KTM sedang diverifikasi'
                            : 'KTM telah diupload'
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* KTM Upload - Only when editing and KTM is required */}
                  {isEditingStudentInfo && isKtmRequired && (
                    <div>
                      <Label htmlFor="ktm">Foto KTM (Kartu Tanda Mahasiswa)</Label>
                      <Input
                        id="ktm"
                        type="file"
                        accept="image/*"
                        onChange={handleKtmFileChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload foto KTM untuk verifikasi data mahasiswa (maksimal 2MB)
                      </p>
                      {ktmFile && (
                        <p className="text-sm text-green-600 mt-1">
                          File dipilih: {ktmFile.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Edit Actions - Only when editing */}
                  {isEditingStudentInfo && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEditingStudentInfo}
                        disabled={saving}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving || (isKtmRequired && !ktmFile) || !profile?.nim || !profile?.fakultas || !profile?.programStudi}
                      >
                        {saving ? 'Menyimpan...' : isKtmRequired ? 'Upload KTM & Verifikasi' : 'Update Data Mahasiswa'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Organization Information - Only for Mitra */}
            {user?.role === 'mitra' && (
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Organisasi</CardTitle>
                  <CardDescription>Informasi penyelenggara event yang akan ditampilkan secara publik</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Organization Name */}
                  <div>
                    <Label htmlFor="organisasi">Nama Organisasi/EO</Label>
                    <Input
                      id="organisasi"
                      value={profile.organisasi || ''}
                      onChange={(e) => handleInputChange('organisasi', e.target.value)}
                      placeholder="Contoh: PT. Nesa Event Organizer"
                    />
                  </div>

                  {/* Organization Description */}
                  <div>
                    <Label htmlFor="deskripsiOrganisasi">Deskripsi Organisasi</Label>
                    <Textarea
                      id="deskripsiOrganisasi"
                      value={profile.deskripsiOrganisasi || ''}
                      onChange={(e) => handleInputChange('deskripsiOrganisasi', e.target.value)}
                      placeholder="Jelaskan tentang organisasi Anda..."
                      rows={3}
                    />
                  </div>

                  {/* Social Media */}
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={profile.instagram || ''}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      placeholder="Contoh: @nesaevent"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="Contoh: https://nesaevent.com"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Save Button */}
          {!isEditingStudentInfo && (
            <div className="mt-4 md:mt-6 flex justify-end">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto px-6 md:px-8">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
