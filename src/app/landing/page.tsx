"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F6F0D7] via-white to-[#C5D89D] opacity-50"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#C5D89D] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#9CAB84] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-[#89986D] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          {/* Header/Navbar */}
          <nav className={`flex justify-between items-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#89986D] to-[#9CAB84] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌱</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#89986D]">IoT Dashboard</h1>
                <p className="text-xs text-gray-500">Smart Agriculture System</p>
              </div>
            </div>
            
            <Link 
              href="/dashboard"
              className="px-6 py-3 bg-[#89986D] text-white rounded-xl font-semibold hover:bg-[#9CAB84] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Buka Dashboard →
            </Link>
          </nav>

          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className={`space-y-8 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="inline-block px-4 py-2 bg-[#F6F0D7] rounded-full text-[#89986D] font-semibold text-sm">
                ✨ Real-time Monitoring System
              </div>
              
              <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Sistem Monitoring
                <span className="block text-[#89986D] mt-2">Pertanian Cerdas</span>
              </h2>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Monitor kelembapan tanah, suhu, kelembapan udara, dan kondisi cuaca secara real-time dengan teknologi IoT dan AI-powered analytics.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/dashboard"
                  className="px-8 py-4 bg-[#89986D] text-white rounded-xl font-bold text-lg hover:bg-[#9CAB84] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  Mulai Monitoring
                </Link>
                <a 
                  href="#features"
                  className="px-8 py-4 bg-white border-2 border-[#C5D89D] text-[#89986D] rounded-xl font-bold text-lg hover:bg-[#F6F0D7] transition-all duration-300"
                >
                  Pelajari Lebih Lanjut
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#89986D]">24/7</div>
                  <div className="text-sm text-gray-600">Real-time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#89986D]">AI</div>
                  <div className="text-sm text-gray-600">Analytics</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#89986D]">IoT</div>
                  <div className="text-sm text-gray-600">Sensors</div>
                </div>
              </div>
            </div>

            {/* Right: Visual/Dashboard Preview */}
            <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative">
                {/* Dashboard Preview Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-[#C5D89D]">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b-2 border-[#F6F0D7]">
                      <h3 className="text-xl font-bold text-gray-800">Live Monitoring</h3>
                      <span className="px-3 py-1 bg-[#F6F0D7] text-[#89986D] rounded-full text-sm font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#89986D] rounded-full animate-pulse"></span>
                        Live
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-[#F6F0D7] to-[#C5D89D] p-4 rounded-xl">
                        <div className="text-3xl mb-2">💧</div>
                        <div className="text-2xl font-bold text-[#89986D]">65%</div>
                        <div className="text-xs text-gray-600">Kelembapan Tanah</div>
                      </div>
                      <div className="bg-gradient-to-br from-[#C5D89D] to-[#9CAB84] p-4 rounded-xl">
                        <div className="text-3xl mb-2">🌡️</div>
                        <div className="text-2xl font-bold text-white">28°C</div>
                        <div className="text-xs text-white">Suhu Udara</div>
                      </div>
                      <div className="bg-gradient-to-br from-[#9CAB84] to-[#89986D] p-4 rounded-xl">
                        <div className="text-3xl mb-2">💨</div>
                        <div className="text-2xl font-bold text-white">70%</div>
                        <div className="text-xs text-white">Kelembapan Udara</div>
                      </div>
                      <div className="bg-gradient-to-br from-[#F6F0D7] to-[#C5D89D] p-4 rounded-xl">
                        <div className="text-3xl mb-2">☀️</div>
                        <div className="text-lg font-bold text-[#89986D]">Cerah</div>
                        <div className="text-xs text-gray-600">Kondisi Cuaca</div>
                      </div>
                    </div>

                    {/* AI Badge */}
                    <div className="bg-gradient-to-r from-[#89986D] to-[#9CAB84] p-4 rounded-xl text-white">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🤖</div>
                        <div>
                          <div className="font-bold">AI-Powered Analytics</div>
                          <div className="text-xs opacity-90">Rekomendasi irigasi otomatis</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Icons */}
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#C5D89D] rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-3xl">📊</span>
                </div>
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-[#9CAB84] rounded-xl flex items-center justify-center shadow-lg animate-bounce animation-delay-1000">
                  <span className="text-3xl">🌾</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-gradient-to-b from-white to-[#F6F0D7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Fitur Unggulan</h2>
            <p className="text-xl text-gray-600">Teknologi terkini untuk pertanian modern</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-[#F6F0D7] hover:border-[#C5D89D]">
              <div className="w-14 h-14 bg-gradient-to-br from-[#C5D89D] to-[#9CAB84] rounded-xl flex items-center justify-center mb-4">
                <span className="text-3xl">💧</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Soil Moisture</h3>
              <p className="text-gray-600">Monitor kelembapan tanah secara real-time dengan sensor ADC 12-bit</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-[#F6F0D7] hover:border-[#C5D89D]">
              <div className="w-14 h-14 bg-gradient-to-br from-[#9CAB84] to-[#89986D] rounded-xl flex items-center justify-center mb-4">
                <span className="text-3xl">🌡️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Air Quality</h3>
              <p className="text-gray-600">Pantau suhu dan kelembapan udara dengan sensor DHT11</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-[#F6F0D7] hover:border-[#C5D89D]">
              <div className="w-14 h-14 bg-gradient-to-br from-[#C5D89D] to-[#9CAB84] rounded-xl flex items-center justify-center mb-4">
                <span className="text-3xl">🌦️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Weather Forecast</h3>
              <p className="text-gray-600">Prediksi cuaca 5 hari dengan OpenWeather API</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-[#F6F0D7] hover:border-[#C5D89D]">
              <div className="w-14 h-14 bg-gradient-to-br from-[#89986D] to-[#9CAB84] rounded-xl flex items-center justify-center mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analytics</h3>
              <p className="text-gray-600">Analisis cerdas dengan Meta Llama 3.3 70B via OpenRouter untuk rekomendasi irigasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Get In Touch - Team Section */}
      <div id="team" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-[#F6F0D7] rounded-full text-[#89986D] font-semibold text-sm mb-4">
              👥 Our Team
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-600">Kenali tim di balik proyek Smart Agriculture IoT</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              {
                name: "Azel",
                role: "Project Leader",
                photo: "/Azel.svg",
                linkedin: "https://www.linkedin.com/in/azel-nacherly-0ab66b310/",
              },
              {
                name: "Handra",
                role: "Hardware Engineer",
                photo: "/Handra.svg",
                linkedin: "https://www.linkedin.com/in/handra-putratama-a07a5b322/",
              },
              {
                name: "Matt",
                role: "Backend Developer",
                photo: "/Matt.svg",
                linkedin: "https://www.linkedin.com/in/matthew-bentardi-818b08322/",
              },
              {
                name: "Karman",
                role: "Frontend Developer",
                photo: "/Karman.svg",
                linkedin: "https://www.linkedin.com/in/karman-951a24322/",
              },
              {
                name: "Avni",
                role: "UI/UX Designer",
                photo: "/Avni.svg",
                linkedin: "https://www.linkedin.com/in/avni-natasya-a72a78322/",
              },
              {
                name: "Lijona",
                role: "Data Analyst",
                photo: "/Lijona.svg",
                linkedin: "https://www.linkedin.com/in/lijona-lorensa-ab2a62322/",
              },
            ].map((member, index) => (
              <div
                key={index}
                className="group flex flex-col items-center text-center"
              >
                {/* Photo */}
                <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-4 border-[#F6F0D7] group-hover:border-[#C5D89D] transition-all duration-300 shadow-lg group-hover:shadow-xl transform group-hover:scale-105">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>

                {/* Role */}
                <p className="text-sm text-[#89986D] font-semibold mb-3">{member.role}</p>

                {/* LinkedIn */}
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F6F0D7] text-[#89986D] rounded-full text-sm font-medium hover:bg-[#89986D] hover:text-white transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-[#89986D] to-[#9CAB84]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Siap Meningkatkan Produktivitas Pertanian?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Mulai monitoring sekarang dengan sistem IoT terintegrasi
          </p>
          <Link 
            href="/dashboard"
            className="inline-block px-10 py-5 bg-white text-[#89986D] rounded-xl font-bold text-lg hover:bg-[#F6F0D7] transition-all duration-300 shadow-2xl hover:shadow-xl transform hover:scale-105"
          >
            Buka Dashboard Sekarang →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="py-12 bg-[#2c2c2c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#89986D] to-[#9CAB84] rounded-lg flex items-center justify-center">
                  <span className="text-xl">🌱</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">IoT Dashboard</h3>
                  <p className="text-xs text-gray-400">Smart Agriculture</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Sistem monitoring pertanian modern dengan teknologi IoT dan AI
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Fitur</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/dashboard" className="hover:text-[#C5D89D] transition">Dashboard</Link></li>
                <li><Link href="/dashboard/soil-moisture" className="hover:text-[#C5D89D] transition">Soil Moisture</Link></li>
                <li><Link href="/dashboard/air-quality" className="hover:text-[#C5D89D] transition">Air Quality</Link></li>
                <li><Link href="/dashboard/weather" className="hover:text-[#C5D89D] transition">Weather</Link></li>
                <li><Link href="/dashboard/analytics" className="hover:text-[#C5D89D] transition">AI Analytics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Teknologi</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Next.js 14</li>
                <li>Firebase Realtime Database</li>
                <li>Meta Llama 3.3 70B (OpenRouter)</li>
                <li>OpenWeather API</li>
                <li>ESP32 IoT Sensors</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 IoT Dashboard - Smart Agriculture System. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
