<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Room;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Early Access (Shadowing) — Masque les coordonnées des annonces de moins de 24h
 * si l'utilisateur n'a pas de Pass actif (sauf Pro / propriétaire de l'annonce).
 */
class CheckEarlyAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $id = $request->route('id');
        if (! $id) {
            return $next($request);
        }

        $room = Room::find($id);
        if (! $room) {
            return $next($request);
        }

        $user = $request->user();
        if ($user && ($user->is_pro ?? false)) {
            return $next($request);
        }

        $hasActivePass = $user && $user->pass_expires_at && $user->pass_expires_at->isFuture();
        if ($hasActivePass) {
            return $next($request);
        }

        $isOwner = $user && (string) $user->_id === (string) $room->owner_id;
        if ($isOwner) {
            return $next($request);
        }

        $createdAt = $room->created_at ?? null;
        if (! $createdAt) {
            return $next($request);
        }

        $isRecent = $createdAt->gt(Carbon::now()->subHours(24));
        if ($isRecent) {
            $request->attributes->set('is_restricted', true);
        }

        return $next($request);
    }
}
