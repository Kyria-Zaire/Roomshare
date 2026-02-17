<?php

declare(strict_types=1);

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

/**
 * Transaction — Journal des paiements (Pass, Boost, Abo Pro).
 *
 * @property string   $user_id
 * @property float    $amount
 * @property string   $currency
 * @property string   $type       pass_day|pass_week|pass_month|ad_boost|pro_sub
 * @property string   $status     pending|completed|failed|refunded
 * @property string|null $stripe_payment_id
 * @property array    $metadata   { ad_id?, duration_days? }
 */
class Transaction extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'transactions';

    protected $fillable = [
        'user_id',
        'amount',
        'currency',
        'type',
        'status',
        'stripe_payment_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public const TYPE_PASS_DAY = 'pass_day';
    public const TYPE_PASS_WEEK = 'pass_week';
    public const TYPE_PASS_MONTH = 'pass_month';
    public const TYPE_AD_BOOST = 'ad_boost';
    public const TYPE_PRO_SUB = 'pro_sub';

    public const STATUS_PENDING = 'pending';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_REFUNDED = 'refunded';
}
