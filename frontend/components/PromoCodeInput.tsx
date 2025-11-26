'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Tag, CheckCircle } from 'lucide-react';

interface PromoCodeInputProps {
  onPromoCodeApplied: (promoCode: any, discountAmount: number, finalTotal: number) => void;
  onPromoCodeRemoved: () => void;
  orderTotal: number;
  eventId?: string;
  appliedPromoCode?: any;
}

export default function PromoCodeInput({
  onPromoCodeApplied,
  onPromoCodeRemoved,
  orderTotal,
  eventId,
  appliedPromoCode
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setError('Masukkan kode promo');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/promocodes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode.trim(),
          orderTotal,
          eventId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Kode promo tidak valid');
        return;
      }

      onPromoCodeApplied(data.promoCode, data.discountAmount, data.finalTotal);
      setPromoCode('');
    } catch (error) {
      setError('Terjadi kesalahan saat memvalidasi kode promo');
    } finally {
      setIsValidating(false);
    }
  };

  const removePromoCode = () => {
    onPromoCodeRemoved();
    setPromoCode('');
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validatePromoCode();
    }
  };

  if (appliedPromoCode) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            Kode Promo Diterapkan
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700">{appliedPromoCode.code}</span>
              <Badge variant="secondary" className="text-xs">
                {appliedPromoCode.discountType === 'percentage'
                  ? `${appliedPromoCode.discountValue}%`
                  : `Rp ${appliedPromoCode.discountValue.toLocaleString('id-ID')}`
                }
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removePromoCode}
              className="text-green-600 hover:text-green-700 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {appliedPromoCode.description && (
            <p className="text-xs text-green-600 mt-1">{appliedPromoCode.description}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Kode Promo</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="promo-code" className="sr-only">
              Kode Promo
            </Label>
            <Input
              id="promo-code"
              placeholder="Masukkan kode promo"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className={error ? 'border-red-500' : ''}
            />
          </div>
          <Button
            onClick={validatePromoCode}
            disabled={isValidating || !promoCode.trim()}
            className="px-6"
          >
            {isValidating ? 'Memvalidasi...' : 'Terapkan'}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}