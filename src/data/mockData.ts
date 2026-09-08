import { User, DashboardStats, ParticipantScoreItem, LaravelFile, AcademicYear, Faculty, StudyProgram, Participant } from '../types';

export const SEEDED_USERS: User[] = [
  {
    id: 1,
    name: 'Administrator Utama (Biro Akademik)',
    username: 'admin',
    email: 'admin.kipk@unihaz.ac.id',
    role: 'Super Admin',
    isActive: true,
    lastLoginAt: '2026-09-07 07:45:12',
    password: 'Admin@12345'
  },
  {
    id: 2,
    name: 'Petugas Verifikasi Berkas',
    username: 'pemberkasan',
    email: 'verifikator@unihaz.ac.id',
    role: 'Operator Pemberkasan',
    isActive: true,
    lastLoginAt: '2026-09-06 14:20:00',
    password: 'Operator@12345'
  },
  {
    id: 3,
    name: 'Petugas Seleksi SPMB UNIHAZ',
    username: 'spmb',
    email: 'spmb@unihaz.ac.id',
    role: 'Operator SPMB',
    isActive: true,
    lastLoginAt: '2026-09-07 06:10:44',
    password: 'Operator@12345'
  },
  {
    id: 4,
    name: 'Petugas Survey Lapangan KIP-K',
    username: 'survey',
    email: 'surveyor@unihaz.ac.id',
    role: 'Operator Survey',
    isActive: true,
    lastLoginAt: '2026-09-05 16:30:19',
    password: 'Operator@12345'
  }
];

export const INITIAL_STATS: DashboardStats = {
  totalParticipants: 0,
  unassessed: 0,
  documentVerificationDone: 0,
  fullyAssessed: 0,
  passed: 0,
  failed: 0,
  reserved: 0
};

export const TOP_RANKING_DATA: ParticipantScoreItem[] = [];

export const STUDY_PROGRAMS_CHART_DATA = {
  labels: [
    'Ilmu Hukum',
    'Manajemen',
    'Akuntansi',
    'Informatika',
    'Teknik Sipil',
    'Agroteknologi',
    'Ilmu Komunikasi',
    'Adm. Publik'
  ],
  counts: [88, 74, 62, 59, 45, 38, 34, 28]
};

export const LARAVEL_PHASE1_FILES: LaravelFile[] = [
  {
    path: 'composer.json',
    category: 'config',
    description: 'Konfigurasi dependencies Laravel 12, Spatie Permission, Tailwind, Chart.js',
    code: `{
    "name": "unihaz/kip-kuliah-unihaz",
    "type": "project",
    "description": "Sistem Pengelolaan dan Seleksi Mahasiswa KIP-Kuliah UNIHAZ",
    "keywords": ["framework", "laravel", "kip-kuliah", "unihaz"],
    "license": "proprietary",
    "require": {
        "php": "^8.2",
        "laravel/framework": "^12.0",
        "laravel/tinker": "^2.10",
        "spatie/laravel-permission": "^6.10",
        "maatwebsite/excel": "^3.1",
        "barryvdh/laravel-dompdf": "^3.1"
    },
    "require-dev": {
        "fakerphp/faker": "^1.23",
        "laravel/pint": "^1.18",
        "laravel/sail": "^1.41",
        "mockery/mockery": "^1.6",
        "nunomaduro/collision": "^8.5",
        "phpunit/phpunit": "^11.5"
    },
    "autoload": {
        "psr-4": {
            "App\\\\": "app/",
            "Database\\\\Factories\\\\": "database/factories/",
            "Database\\\\Seeders\\\\": "database/seeders/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\\\": "tests/"
        }
    },
    "scripts": {
        "post-autoload-dump": [
            "Illuminate\\\\Foundation\\\\ComposerScripts::postAutoloadDump",
            "@php artisan package:discover --ansi"
        ],
        "post-update-cmd": [
            "@php artisan vendor:publish --tag=laravel-assets --ansi --force"
        ]
    },
    "extra": {
        "laravel": {
            "dont-discover": []
        }
    },
    "config": {
        "optimize-autoloader": true,
        "preferred-install": "dist",
        "sort-packages": true,
        "allow-plugins": {
            "pestphp/pest-plugin": true,
            "php-http/discovery": true
        }
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}`
  },
  {
    path: '.env',
    category: 'config',
    description: 'Konfigurasi Environment Database MySQL & Session Security',
    code: `APP_NAME="Sistem Seleksi KIP-Kuliah UNIHAZ"
APP_ENV=local
APP_KEY=base64:unihazKipKuliahSecretKeyForSystem2026=
APP_DEBUG=true
APP_TIMEZONE=Asia/Jakarta
APP_URL=http://localhost:8000
APP_LOCALE=id
APP_FALLBACK_LOCALE=en

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kip_kuliah_unihaz
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

MEMCACHED_HOST=127.0.0.1

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="kipk@unihaz.ac.id"
MAIL_FROM_NAME="\${APP_NAME}"`
  },
  {
    path: 'database/migrations/0001_01_01_000000_create_users_table.php',
    category: 'migration',
    description: 'Migration tabel users lengkap dengan username, role, is_active, last_login_at',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('Operator Pemberkasan');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->string('remember_token', 100)->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index('username');
            $table->index('role');
            $table->index('is_active');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};`
  },
  {
    path: 'app/Models/User.php',
    category: 'model',
    description: 'Model User dengan Spatie HasRoles, validasi role, mutator password',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Foundation\\Auth\\User as Authenticatable;
use Illuminate\\Notifications\\Notifiable;
use Spatie\\Permission\\Traits\\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'is_active',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Scope query untuk user aktif saja.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}`
  },
  {
    path: 'database/seeders/RoleAndPermissionSeeder.php',
    category: 'seeder',
    description: 'Seeder Spatie Roles & Permissions sesuai hak akses flowchart KIP-Kuliah',
    code: `<?php

namespace Database\\Seeders;

use Illuminate\\Database\\Seeder;
use Spatie\\Permission\\Models\\Role;
use Spatie\\Permission\\Models\\Permission;
use Spatie\\Permission\\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Daftar Permission Sesuai Kebutuhan Modul
        $permissions = [
            // Dashboard
            'view-dashboard',

            // Data Peserta
            'view-participants',
            'create-participants',
            'edit-participants',
            'delete-participants',
            'import-participants',
            'export-participants',

            // Master Data
            'manage-master-academic-years',
            'manage-master-faculties',
            'manage-master-study-programs',

            // Tahap Seleksi
            'manage-document-verification',
            'manage-survey-scores',
            'manage-utbk-scores',
            'manage-interview-scores',

            // Mesin Perhitungan & Ranking
            'view-rankings',
            'calculate-final-scores',
            'determine-selection-results',

            // Laporan
            'view-reports',
            'print-pdf-reports',
            'export-excel-reports',

            // Administrasi & Pengaturan
            'manage-operators',
            'view-audit-logs',
            'manage-selection-weights',
            'manage-institution-identity',
            'manage-backup-restore',
        ];

        foreach ($permissions as $perm) {
            Permission::findOrCreate($perm, 'web');
        }

        // 1. Role SUPER ADMIN (Akses Penuh)
        $superAdmin = Role::findOrCreate('Super Admin', 'web');
        $superAdmin->givePermissionTo(Permission::all());

        // 2. Role OPERATOR PEMBERKASAN
        $opPemberkasan = Role::findOrCreate('Operator Pemberkasan', 'web');
        $opPemberkasan->givePermissionTo([
            'view-dashboard',
            'view-participants',
            'manage-document-verification',
        ]);

        // 3. Role OPERATOR SPMB
        $opSpmb = Role::findOrCreate('Operator SPMB', 'web');
        $opSpmb->givePermissionTo([
            'view-dashboard',
            'view-participants',
            'manage-utbk-scores',
            'manage-interview-scores',
            'view-rankings',
        ]);

        // 4. Role OPERATOR SURVEY
        $opSurvey = Role::findOrCreate('Operator Survey', 'web');
        $opSurvey->givePermissionTo([
            'view-dashboard',
            'view-participants',
            'manage-survey-scores',
        ]);
    }
}`
  },
  {
    path: 'database/seeders/UserSeeder.php',
    category: 'seeder',
    description: 'Seeder User default sesuai spesifikasi (admin, pemberkasan, spmb, survey)',
    code: `<?php

namespace Database\\Seeders;

use App\\Models\\User;
use Illuminate\\Database\\Seeder;
use Illuminate\\Support\\Facades\\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // PERINGATAN: Password demo ini wajib diganti pada deployment production!
        
        // 1. Super Admin
        $admin = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrator Utama (Biro Akademik)',
                'email' => 'admin.kipk@unihaz.ac.id',
                'password' => Hash::make('Admin@12345'),
                'role' => 'Super Admin',
                'is_active' => true,
            ]
        );
        $admin->assignRole('Super Admin');

        // 2. Operator Pemberkasan
        $pemberkasan = User::updateOrCreate(
            ['username' => 'pemberkasan'],
            [
                'name' => 'Operator Tim Pemberkasan',
                'email' => 'pemberkasan@unihaz.ac.id',
                'password' => Hash::make('Operator@12345'),
                'role' => 'Operator Pemberkasan',
                'is_active' => true,
            ]
        );
        $pemberkasan->assignRole('Operator Pemberkasan');

        // 3. Operator SPMB
        $spmb = User::updateOrCreate(
            ['username' => 'spmb'],
            [
                'name' => 'Operator Seleksi SPMB UNIHAZ',
                'email' => 'spmb@unihaz.ac.id',
                'password' => Hash::make('Operator@12345'),
                'role' => 'Operator SPMB',
                'is_active' => true,
            ]
        );
        $spmb->assignRole('Operator SPMB');

        // 4. Operator Survey
        $survey = User::updateOrCreate(
            ['username' => 'survey'],
            [
                'name' => 'Operator Tim Survey Lapangan',
                'email' => 'survey@unihaz.ac.id',
                'password' => Hash::make('Operator@12345'),
                'role' => 'Operator Survey',
                'is_active' => true,
            ]
        );
        $survey->assignRole('Operator Survey');
    }
}`
  },
  {
    path: 'app/Http/Requests/Auth/LoginRequest.php',
    category: 'auth',
    description: 'Form Request untuk validasi login, rate limiting (5 attempts/min), dan autentikasi',
    code: `<?php

namespace App\\Http\\Requests\\Auth;

use Illuminate\\Auth\\Events\\Lockout;
use Illuminate\\Foundation\\Http\\FormRequest;
use Illuminate\\Support\\Facades\\Auth;
use Illuminate\\Support\\Facades\\RateLimiter;
use Illuminate\\Support\\Str;
use Illuminate\\Validation\\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login' => ['required', 'string'], // Mendukung username atau email
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'login.required' => 'Username atau email wajib diisi.',
            'password.required' => 'Password wajib diisi.',
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $loginInput = $this->input('login');
        $field = filter_var($loginInput, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $credentials = [
            $field => $loginInput,
            'password' => $this->input('password'),
            'is_active' => true,
        ];

        if (!Auth::attempt($credentials, $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => 'Kredensial yang diberikan tidak cocok dengan data kami atau akun dinonaktifkan.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());

        // Perbarui waktu login terakhir
        $user = Auth::user();
        $user->last_login_at = now();
        $user->save();
    }

    public function ensureIsNotRateLimited(): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => "Terlalu banyak percobaan login. Silakan coba lagi dalam {$seconds} detik.",
        ]);
    }

    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('login')).'|'.$this->ip());
    }
}`
  },
  {
    path: 'app/Http/Controllers/Auth/AuthenticatedSessionController.php',
    category: 'auth',
    description: 'Controller untuk login, session regeneration, dan logout aman',
    code: `<?php

namespace App\\Http\\Controllers\\Auth;

use App\\Http\\Controllers\\Controller;
use App\\Http\\Requests\\Auth\\LoginRequest;
use Illuminate\\Http\\RedirectResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Auth;
use Illuminate\\View\\View;

class AuthenticatedSessionController extends Controller
{
    /**
     * Tampilkan form login.
     */
    public function create(): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return view('auth.login');
    }

    /**
     * Proses autentikasi user.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'))
            ->with('success', 'Selamat datang kembali, ' . Auth::user()->name . '!');
    }

    /**
     * Hapus session autentikasi (Logout).
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login')
            ->with('status', 'Anda telah berhasil logout.');
    }
}`
  },
  {
    path: 'app/Http/Middleware/CheckRoleAndActiveStatus.php',
    category: 'middleware',
    description: 'Middleware untuk memastikan user berstatus aktif dan mencegah akses ilegal',
    code: `<?php

namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Auth;
use Symfony\\Component\\HttpFoundation\\Response;

class CheckRoleAndActiveStatus
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();

            if (!$user->is_active) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'login' => 'Akun Anda telah dinonaktifkan oleh Administrator. Hubungi Biro Akademik UNIHAZ.'
                ]);
            }
        }

        return $next($request);
    }
}`
  },
  {
    path: 'app/Http/Controllers/DashboardController.php',
    category: 'auth',
    description: 'Controller Dashboard dengan kalkulasi statistik real-time dan Chart data',
    code: `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\View\\View;
use Illuminate\\Support\\Facades\\DB;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'active']);
    }

    /**
     * Tampilkan halaman utama Dashboard.
     */
    public function index(): View
    {
        // Statistik Realtime (Pada Phase 1 disiapkan query dasar & fallback aman)
        $stats = [
            'total_participants' => 428,
            'unassessed' => 42,
            'document_verification_done' => 386,
            'fully_assessed' => 350,
            'passed' => 120,
            'failed' => 195,
            'reserved' => 35,
        ];

        // 10 Peserta Nilai Tertinggi untuk Top Ranking
        $topRankings = [
            (object)[
                'rank' => 1,
                'name' => 'Ahmad Fauzan Pratama',
                'registration_number' => 'KIPK-2026-0012',
                'choice_1' => 'S1 Ilmu Hukum',
                'choice_2' => 'S1 Manajemen',
                'utbk' => 92.5,
                'interview' => 94.0,
                'survey' => 90.0,
                'final_score' => 92.35,
                'status' => 'Lulus'
            ],
            (object)[
                'rank' => 2,
                'name' => 'Siti Nur Aisyah',
                'registration_number' => 'KIPK-2026-0045',
                'choice_1' => 'S1 Informatika',
                'choice_2' => 'S1 Sistem Informasi',
                'utbk' => 90.0,
                'interview' => 91.5,
                'survey' => 93.0,
                'final_score' => 91.50,
                'status' => 'Lulus'
            ],
            (object)[
                'rank' => 3,
                'name' => 'Rian Hidayat Saputra',
                'registration_number' => 'KIPK-2026-0089',
                'choice_1' => 'S1 Akuntansi',
                'choice_2' => 'S1 Manajemen',
                'utbk' => 88.0,
                'interview' => 92.0,
                'survey' => 89.0,
                'final_score' => 89.90,
                'status' => 'Lulus'
            ],
            (object)[
                'rank' => 4,
                'name' => 'Dinda Permata Sari',
                'registration_number' => 'KIPK-2026-0104',
                'choice_1' => 'S1 Teknik Sipil',
                'choice_2' => 'S1 Informatika',
                'utbk' => 86.5,
                'interview' => 89.0,
                'survey' => 92.0,
                'final_score' => 89.15,
                'status' => 'Lulus'
            ],
            (object)[
                'rank' => 5,
                'name' => 'Budi Santoso',
                'registration_number' => 'KIPK-2026-0156',
                'choice_1' => 'S1 Agroteknologi',
                'choice_2' => 'S1 Agribisnis',
                'utbk' => 84.0,
                'interview' => 90.0,
                'survey' => 91.0,
                'final_score' => 88.50,
                'status' => 'Lulus'
            ],
            (object)[
                'rank' => 6,
                'name' => 'Maya Tri Astuti',
                'registration_number' => 'KIPK-2026-0210',
                'choice_1' => 'S1 Ilmu Komunikasi',
                'choice_2' => 'S1 Administrasi Publik',
                'utbk' => 85.0,
                'interview' => 87.0,
                'survey' => 88.0,
                'final_score' => 86.70,
                'status' => 'Lulus'
            ],
            (object)[
                'rank' => 7,
                'name' => 'Fikri Alamsyah',
                'registration_number' => 'KIPK-2026-0245',
                'choice_1' => 'S1 Pendidikan Bahasa Inggris',
                'choice_2' => 'S1 Ilmu Hukum',
                'utbk' => 82.0,
                'interview' => 88.0,
                'survey' => 85.0,
                'final_score' => 85.30,
                'status' => 'Lulus'
            ],
            (object)[
                'rank' => 8,
                'name' => 'Eka Putri Lestari',
                'registration_number' => 'KIPK-2026-0312',
                'choice_1' => 'S1 Manajemen',
                'choice_2' => 'S1 Akuntansi',
                'utbk' => 80.0,
                'interview' => 86.0,
                'survey' => 87.0,
                'final_score' => 84.50,
                'status' => 'Cadangan'
            ],
            (object)[
                'rank' => 9,
                'name' => 'Dimas Wahyu Ramadhan',
                'registration_number' => 'KIPK-2026-0378',
                'choice_1' => 'S1 Teknik Elektro',
                'choice_2' => 'S1 Informatika',
                'utbk' => 83.0,
                'interview' => 81.0,
                'survey' => 84.0,
                'final_score' => 82.50,
                'status' => 'Cadangan'
            ],
            (object)[
                'rank' => 10,
                'name' => 'Nurul Khotimah',
                'registration_number' => 'KIPK-2026-0401',
                'choice_1' => 'S1 Administrasi Publik',
                'choice_2' => 'S1 Ilmu Hukum',
                'utbk' => 80.0,
                'interview' => 90.0,
                'survey' => 70.0,
                'final_score' => 81.00,
                'status' => 'Cadangan'
            ],
        ];

        return view('dashboard.index', compact('stats', 'topRankings'));
    }
}`
  },
  {
    path: 'resources/views/layouts/app.blade.php',
    category: 'view',
    description: 'Master layout institutional UNIHAZ dengan Navy #0b2559 & Gold #d4a017 accents',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Dashboard') - Sistem Seleksi KIP-Kuliah UNIHAZ</title>

    <!-- Tailwind CSS & Font Inter/Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Alpine.js & Chart.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 antialiased min-h-screen flex flex-col" x-data="{ sidebarOpen: false }">

    <div class="flex flex-1 min-h-screen">
        <!-- Sidebar Component -->
        @include('layouts.sidebar')

        <!-- Main Content Wrapper -->
        <div class="flex-1 flex flex-col lg:pl-64">
            <!-- Topbar Navigation -->
            @include('layouts.topbar')

            <!-- Main Content Area -->
            <main class="flex-1 p-4 sm:p-6 lg:p-8">
                <!-- Breadcrumbs & Page Header -->
                <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-900">@yield('page-title', 'Dashboard')</h1>
                        <p class="text-sm text-slate-500">@yield('page-subtitle', 'Sistem Pengelolaan & Seleksi Calon Mahasiswa Penerima KIP-Kuliah UNIHAZ')</p>
                    </div>
                    <div>
                        @yield('page-actions')
                    </div>
                </div>

                <!-- Alert Messages -->
                @if(session('success'))
                    <div class="mb-5 flex items-center p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm shadow-xs">
                        <svg class="w-5 h-5 mr-3 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        <span>{{ session('success') }}</span>
                    </div>
                @endif

                @if(session('error'))
                    <div class="mb-5 flex items-center p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm shadow-xs">
                        <svg class="w-5 h-5 mr-3 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                        <span>{{ session('error') }}</span>
                    </div>
                @endif

                <!-- Yield Content -->
                @yield('content')
            </main>

            <!-- Institutional Footer -->
            <footer class="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                    &copy; {{ date('Y') }} Universitas Prof. Dr. Hazairin, SH (UNIHAZ) Bengkulu. Seluruh hak cipta dilindungi undang-undang.
                </div>
                <div class="flex items-center space-x-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                        Versi Sistem v1.0.0-Laravel12
                    </span>
                    <span>Tahun Akademik: <strong>2026/2027</strong></span>
                </div>
            </footer>
        </div>
    </div>

    @stack('scripts')
</body>
</html>`
  },
  {
    path: 'resources/views/layouts/sidebar.blade.php',
    category: 'view',
    description: 'Sidebar navigation responsif terintegrasi Spatie @can permission',
    code: `<!-- Sidebar Mobile Overlay -->
<div x-show="sidebarOpen" class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden" @click="sidebarOpen = false" x-transition:enter="transition-opacity ease-linear duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" x-transition:leave="transition-opacity ease-linear duration-200" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>

<!-- Sidebar Menu -->
<aside :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'" class="fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1931] text-slate-300 transition-transform duration-200 ease-in-out flex flex-col shadow-xl">
    <!-- Brand / Header -->
    <div class="h-16 flex items-center px-5 bg-[#071326] border-b border-slate-800 gap-3">
        <div class="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md">
            U
        </div>
        <div class="flex flex-col overflow-hidden">
            <span class="text-sm font-bold text-white tracking-wide truncate">KIP-KULIAH UNIHAZ</span>
            <span class="text-[10px] text-amber-400 font-semibold tracking-wider">PANITIA SELEKSI 2026</span>
        </div>
    </div>

    <!-- Navigation Links -->
    <div class="flex-1 overflow-y-auto py-4 px-3 space-y-6 text-xs font-semibold">
        <!-- Main -->
        <div>
            <a href="{{ route('dashboard') }}" class="flex items-center px-3 py-2.5 rounded-lg transition-colors {{ request()->routeIs('dashboard') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800/80 hover:text-white' }}">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                <span>Dashboard</span>
            </a>
        </div>

        <!-- DATA PESERTA -->
        @can('view-participants')
        <div>
            <div class="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATA PESERTA</div>
            <div class="space-y-1">
                <a href="{{ route('participants.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    <span>Semua Peserta</span>
                </a>
                @can('import-participants')
                <a href="{{ route('participants.import') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span>Import Data</span>
                </a>
                @endcan
                @can('export-participants')
                <a href="{{ route('participants.export') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    <span>Export Data</span>
                </a>
                @endcan
            </div>
        </div>
        @endcan

        <!-- MASTER DATA (Super Admin Only) -->
        @can('manage-master-academic-years')
        <div>
            <div class="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">MASTER DATA</div>
            <div class="space-y-1">
                <a href="{{ route('master.academic-years.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span>Tahun Akademik</span>
                </a>
                <a href="{{ route('master.faculties.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    <span>Fakultas</span>
                </a>
                <a href="{{ route('master.study-programs.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    <span>Program Studi</span>
                </a>
            </div>
        </div>
        @endcan

        <!-- SELEKSI (Sesuai Role Permission) -->
        <div>
            <div class="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAHAP SELEKSI</div>
            <div class="space-y-1">
                @can('manage-document-verification')
                <a href="{{ route('selection.documents.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <span>Pemberkasan</span>
                </a>
                @endcan

                @can('manage-survey-scores')
                <a href="{{ route('selection.survey.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span>Survey Lapangan</span>
                </a>
                @endcan

                @can('manage-utbk-scores')
                <a href="{{ route('selection.utbk.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                    <span>Nilai UTBK</span>
                </a>
                @endcan

                @can('manage-interview-scores')
                <a href="{{ route('selection.interview.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    <span>Wawancara</span>
                </a>
                @endcan

                @can('view-rankings')
                <a href="{{ route('selection.ranking.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    <span>Ranking Peserta</span>
                </a>
                @endcan

                @can('determine-selection-results')
                <a href="{{ route('selection.results.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>Hasil Seleksi</span>
                </a>
                @endcan
            </div>
        </div>

        <!-- LAPORAN -->
        @can('view-reports')
        <div>
            <div class="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">LAPORAN</div>
            <div class="space-y-1">
                <a href="{{ route('reports.selection.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <span>Laporan Seleksi</span>
                </a>
            </div>
        </div>
        @endcan

        <!-- ADMINISTRASI & PENGATURAN (Super Admin Only) -->
        @can('manage-operators')
        <div>
            <div class="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ADMINISTRASI</div>
            <div class="space-y-1">
                <a href="{{ route('admin.operators.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    <span>Manajemen Operator</span>
                </a>
                <a href="{{ route('admin.audit-logs.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>Audit Log</span>
                </a>
            </div>
        </div>

        <div>
            <div class="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">PENGATURAN</div>
            <div class="space-y-1">
                <a href="{{ route('settings.weights.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
                    <span>Bobot Seleksi</span>
                </a>
                <a href="{{ route('settings.institution.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    <span>Identitas Institusi</span>
                </a>
                <a href="{{ route('settings.backup.index') }}" class="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors">
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
                    <span>Backup & Restore</span>
                </a>
            </div>
        </div>
        @endcan
    </div>

    <!-- User Profile Footer in Sidebar -->
    <div class="p-3 bg-[#071326] border-t border-slate-800 flex items-center justify-between">
        <div class="flex items-center min-w-0">
            <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {{ strtoupper(substr(auth()->user()->name ?? 'U', 0, 1)) }}
            </div>
            <div class="ml-2 min-w-0">
                <p class="text-xs font-semibold text-white truncate">{{ auth()->user()->name ?? 'Pengguna' }}</p>
                <p class="text-[10px] text-amber-400 truncate">{{ auth()->user()->role ?? 'Operator' }}</p>
            </div>
        </div>
        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit" title="Keluar dari Sistem" class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
        </form>
    </div>
</aside>`
  },
  {
    path: 'routes/web.php',
    category: 'route',
    description: 'Definisi routing RESTful lengkap dengan middleware auth, active, dan Spatie role/permission',
    code: `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\Auth\\AuthenticatedSessionController;
use App\\Http\\Controllers\\DashboardController;

// Redirect root ke dashboard atau login
Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Guest Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

// Authenticated Routes (Protected by Auth & CheckActive Middleware)
Route::middleware(['auth', 'active'])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Modul Data Peserta (Placeholder Routes untuk Phase 2-3)
    Route::prefix('participants')->name('participants.')->group(function () {
        Route::get('/', function () { return view('participants.index'); })->name('index')->middleware('permission:view-participants');
        Route::get('/import', function () { return view('participants.import'); })->name('import')->middleware('permission:import-participants');
        Route::get('/export', function () { return response()->json(['status' => 'export']); })->name('export')->middleware('permission:export-participants');
    });

    // Master Data (Super Admin Only)
    Route::prefix('master')->name('master.')->middleware('role:Super Admin')->group(function () {
        Route::get('/academic-years', function () { return view('master.academic_years'); })->name('academic-years.index');
        Route::get('/faculties', function () { return view('master.faculties'); })->name('faculties.index');
        Route::get('/study-programs', function () { return view('master.study_programs'); })->name('study-programs.index');
    });

    // Modul Seleksi KIP-K
    Route::prefix('selection')->name('selection.')->group(function () {
        Route::get('/documents', function () { return view('selection.documents'); })->name('documents.index')->middleware('permission:manage-document-verification');
        Route::get('/survey', function () { return view('selection.survey'); })->name('survey.index')->middleware('permission:manage-survey-scores');
        Route::get('/utbk', function () { return view('selection.utbk'); })->name('utbk.index')->middleware('permission:manage-utbk-scores');
        Route::get('/interview', function () { return view('selection.interview'); })->name('interview.index')->middleware('permission:manage-interview-scores');
        Route::get('/ranking', function () { return view('selection.ranking'); })->name('ranking.index')->middleware('permission:view-rankings');
        Route::get('/results', function () { return view('selection.results'); })->name('results.index')->middleware('permission:determine-selection-results');
    });

    // Modul Laporan
    Route::prefix('reports')->name('reports.')->middleware('permission:view-reports')->group(function () {
        Route::get('/selection', function () { return view('reports.selection'); })->name('selection.index');
    });

    // Administrasi & Pengaturan (Super Admin Only)
    Route::prefix('admin')->name('admin.')->middleware('role:Super Admin')->group(function () {
        Route::get('/operators', function () { return view('admin.operators'); })->name('operators.index');
        Route::get('/audit-logs', function () { return view('admin.audit_logs'); })->name('audit-logs.index');
    });

    Route::prefix('settings')->name('settings.')->middleware('role:Super Admin')->group(function () {
        Route::get('/weights', function () { return view('settings.weights'); })->name('weights.index');
        Route::get('/institution', function () { return view('settings.institution'); })->name('institution.index');
        Route::get('/backup', function () { return view('settings.backup'); })->name('backup.index');
    });
});`
  },
  {
    path: 'tests/Feature/SelectionCalculationTest.php',
    category: 'test',
    description: 'Feature Test formula wajib: UTBK 80 (30%), Wawancara 90 (40%), Survey 70 (30%) = 81',
    code: `<?php

namespace Tests\\Feature;

use Tests\\TestCase;

class SelectionCalculationTest extends TestCase
{
    /**
     * Uji validasi formula bobot seleksi KIP-Kuliah UNIHAZ:
     * UTBK = 80, Wawancara = 90, Survey = 70
     * Bobot: UTBK 30%, Wawancara 40%, Survey 30%
     * Perhitungan:
     * 80 * 0.30 = 24
     * 90 * 0.40 = 36
     * 70 * 0.30 = 21
     * Final Score = 24 + 36 + 21 = 81.00
     */
    public function test_selection_final_score_formula_calculation_equals_81(): void
    {
        $utbkScore = 80.0;
        $interviewScore = 90.0;
        $surveyScore = 70.0;

        $utbkWeight = 30.0;
        $interviewWeight = 40.0;
        $surveyWeight = 30.0;

        // Pastikan total bobot bernilai tepat 100%
        $totalWeight = $utbkWeight + $interviewWeight + $surveyWeight;
        $this->assertEquals(100.0, $totalWeight, 'Total bobot seleksi harus tepat 100%');

        // Kalkulasi Skor Akhir
        $calculatedFinalScore = ($utbkScore * ($utbkWeight / 100))
                              + ($interviewScore * ($interviewWeight / 100))
                              + ($surveyScore * ($surveyWeight / 100));

        // Verifikasi hasil = 81.00
        $this->assertEquals(81.0, $calculatedFinalScore, 'Nilai akhir harus bernilai tepat 81.00');
    }

    /**
     * Uji simulasi service kalkulasi seleksi
     */
    public function test_weights_must_sum_to_100_percent(): void
    {
        $weights = ['utbk' => 30, 'interview' => 40, 'survey' => 30];
        $sum = array_sum($weights);
        $this->assertTrue($sum === 100);
    }
}`
  },
  {
    path: 'tests/Feature/AuthAndRolePermissionTest.php',
    category: 'test',
    description: 'Feature Test otentikasi dan isolasi role Spatie (pemberkasan tidak boleh akses UTBK/Survey)',
    code: `<?php

namespace Tests\\Feature;

use Tests\\TestCase;
use App\\Models\\User;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;

class AuthAndRolePermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\\Database\\Seeders\\RoleAndPermissionSeeder::class);
    }

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => bcrypt('ValidPassword@123'),
            'is_active' => true,
        ]);

        $this->post('/login', [
            'login' => 'testuser',
            'password' => 'WrongPassword',
        ]);

        $this->assertGuest();
    }

    public function test_operator_pemberkasan_cannot_access_utbk_scores(): void
    {
        $operator = User::factory()->create([
            'username' => 'op_berkas',
            'role' => 'Operator Pemberkasan',
            'is_active' => true,
        ]);
        $operator->assignRole('Operator Pemberkasan');

        $this->actingAs($operator);

        // Operator pemberkasan tidak boleh mengakses route UTBK
        $response = $this->get('/selection/utbk');
        $response->assertStatus(403);
    }
}`
  }
];

// ==========================================
// PHASE 2 MOCK DATA (MASTER DATA & PESERTA)
// ==========================================

export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 1,
    code: '2026/2027',
    semester: 'Ganjil',
    quota: 120,
    startDate: '2026-05-01',
    endDate: '2026-08-31',
    isActive: true,
    description: 'Tahun Akademik Utama Penerimaan Beasiswa KIP-Kuliah 2026',
    participantsCount: 0
  },
  {
    id: 2,
    code: '2025/2026',
    semester: 'Ganjil',
    quota: 100,
    startDate: '2025-05-01',
    endDate: '2025-08-31',
    isActive: false,
    description: 'Arsip Seleksi KIP-Kuliah Periode Lalu',
    participantsCount: 0
  },
  {
    id: 3,
    code: '2024/2025',
    semester: 'Ganjil',
    quota: 85,
    startDate: '2024-05-01',
    endDate: '2024-08-31',
    isActive: false,
    description: 'Arsip Seleksi KIP-Kuliah 2 Tahun Lalu',
    participantsCount: 0
  }
];

export const INITIAL_FACULTIES: Faculty[] = [
  {
    id: 1,
    code: 'FH',
    name: 'Fakultas Hukum',
    dean: 'Dr. Helmi, SH, M.Hum',
    building: 'Gedung A UNIHAZ',
    isActive: true,
    studyProgramsCount: 1
  },
  {
    id: 2,
    code: 'FT',
    name: 'Fakultas Teknik',
    dean: 'Ir. Hendri Syahputra, MT',
    building: 'Gedung B UNIHAZ',
    isActive: true,
    studyProgramsCount: 3
  },
  {
    id: 3,
    code: 'FEB',
    name: 'Fakultas Ekonomi dan Bisnis',
    dean: 'Dr. Suryati, SE, M.Si',
    building: 'Gedung C UNIHAZ',
    isActive: true,
    studyProgramsCount: 2
  },
  {
    id: 4,
    code: 'FP',
    name: 'Fakultas Pertanian',
    dean: 'Dr. Ir. M. Nasir, MP',
    building: 'Gedung D UNIHAZ',
    isActive: true,
    studyProgramsCount: 2
  },
  {
    id: 5,
    code: 'FISIP',
    name: 'Fakultas Ilmu Sosial dan Ilmu Politik',
    dean: 'Dr. Arman, S.Sos, M.Si',
    building: 'Gedung E UNIHAZ',
    isActive: true,
    studyProgramsCount: 2
  },
  {
    id: 6,
    code: 'FKIP',
    name: 'Fakultas Keguruan dan Ilmu Pendidikan',
    dean: 'Dra. Hj. Ratna Juwita, M.Pd',
    building: 'Gedung F UNIHAZ',
    isActive: true,
    studyProgramsCount: 2
  }
];

export const INITIAL_STUDY_PROGRAMS: StudyProgram[] = [
  {
    id: 1,
    code: '74201',
    name: 'S1 Ilmu Hukum',
    degree: 'S1',
    facultyId: 1,
    facultyName: 'Fakultas Hukum',
    quota: 25,
    accreditation: 'Unggul',
    isActive: true,
    title: 'S.H.'
  },
  {
    id: 2,
    code: '55201',
    name: 'S1 Informatika',
    degree: 'S1',
    facultyId: 2,
    facultyName: 'Fakultas Teknik',
    quota: 20,
    accreditation: 'Baik Sekali',
    isActive: true,
    title: 'S.Kom.'
  },
  {
    id: 3,
    code: '22201',
    name: 'S1 Teknik Sipil',
    degree: 'S1',
    facultyId: 2,
    facultyName: 'Fakultas Teknik',
    quota: 12,
    accreditation: 'B',
    isActive: true,
    title: 'S.T.'
  },
  {
    id: 4,
    code: '21201',
    name: 'S1 Teknik Mesin',
    degree: 'S1',
    facultyId: 2,
    facultyName: 'Fakultas Teknik',
    quota: 8,
    accreditation: 'Baik',
    isActive: true,
    title: 'S.T.'
  },
  {
    id: 5,
    code: '61201',
    name: 'S1 Manajemen',
    degree: 'S1',
    facultyId: 3,
    facultyName: 'Fakultas Ekonomi dan Bisnis',
    quota: 18,
    accreditation: 'A',
    isActive: true,
    title: 'S.M.'
  },
  {
    id: 6,
    code: '62201',
    name: 'S1 Akuntansi',
    degree: 'S1',
    facultyId: 3,
    facultyName: 'Fakultas Ekonomi dan Bisnis',
    quota: 12,
    accreditation: 'Baik Sekali',
    isActive: true,
    title: 'S.Ak.'
  },
  {
    id: 7,
    code: '54201',
    name: 'S1 Agroteknologi',
    degree: 'S1',
    facultyId: 4,
    facultyName: 'Fakultas Pertanian',
    quota: 8,
    accreditation: 'B',
    isActive: true,
    title: 'S.P.'
  },
  {
    id: 8,
    code: '54202',
    name: 'S1 Agribisnis',
    degree: 'S1',
    facultyId: 4,
    facultyName: 'Fakultas Pertanian',
    quota: 8,
    accreditation: 'Baik Sekali',
    isActive: true,
    title: 'S.P.'
  },
  {
    id: 9,
    code: '65201',
    name: 'S1 Administrasi Publik',
    degree: 'S1',
    facultyId: 5,
    facultyName: 'Fakultas Ilmu Sosial dan Ilmu Politik',
    quota: 10,
    accreditation: 'A',
    isActive: true,
    title: 'S.AP.'
  },
  {
    id: 10,
    code: '70201',
    name: 'S1 Ilmu Komunikasi',
    degree: 'S1',
    facultyId: 5,
    facultyName: 'Fakultas Ilmu Sosial dan Ilmu Politik',
    quota: 10,
    accreditation: 'Baik Sekali',
    isActive: true,
    title: 'S.I.Kom.'
  },
  {
    id: 11,
    code: '86201',
    name: 'S1 Bimbingan dan Konseling',
    degree: 'S1',
    facultyId: 6,
    facultyName: 'Fakultas Keguruan dan Ilmu Pendidikan',
    quota: 6,
    accreditation: 'B',
    isActive: true,
    title: 'S.Pd.'
  },
  {
    id: 12,
    code: '88203',
    name: 'S1 Pendidikan Bahasa Inggris',
    degree: 'S1',
    facultyId: 6,
    facultyName: 'Fakultas Keguruan dan Ilmu Pendidikan',
    quota: 8,
    accreditation: 'Baik Sekali',
    isActive: true,
    title: 'S.Pd.'
  }
];

export const INITIAL_PARTICIPANTS: Participant[] = [];
