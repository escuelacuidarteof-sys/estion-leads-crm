import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, CircleCheck } from 'lucide-react';

interface SignaturePadProps {
    onSignatureCapture: (dataUrl: string) => void;
    onClear: () => void;
    disabled?: boolean;
}

export function SignaturePad({ onSignatureCapture, onClear, disabled }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const resizeCanvas = () => {
                const rect = canvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;

                // Only resize if we have actual dimensions
                if (rect.width > 0 && rect.height > 0) {
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.scale(dpr, dpr);
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 2.5;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                    }
                }
            };

            // Immediate resize
            resizeCanvas();

            // Multiple attempts to handle dynamic layout/loading
            const timer1 = setTimeout(resizeCanvas, 100);
            const timer2 = setTimeout(resizeCanvas, 500);

            window.addEventListener('resize', resizeCanvas);
            return () => {
                window.removeEventListener('resize', resizeCanvas);
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            if (e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if ((e as any).changedTouches && (e as any).changedTouches.length > 0) {
                clientX = (e as any).changedTouches[0].clientX;
                clientY = (e as any).changedTouches[0].clientY;
            } else {
                return { x: 0, y: 0 };
            }
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        // Return coordinates relative to the canvas in CSS pixels
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            setIsDrawing(true);
        }
        if (e.cancelable) e.preventDefault();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const signatureData = canvas.toDataURL('image/png');
            onSignatureCapture(signatureData);
            setHasSignature(true);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled) return;
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        if (e.cancelable) e.preventDefault();
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
            onClear();
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <PenTool className="w-4 h-4" />
                    Firma Digital aquí
                </label>
                <button
                    onClick={clearSignature}
                    disabled={disabled}
                    className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-all disabled:opacity-50"
                >
                    <RotateCcw className="w-3 h-3" />
                    Borrar firma
                </button>
            </div>
            <div className={`border-2 border-dashed rounded-xl bg-white overflow-hidden touch-none h-[200px] ${disabled ? 'border-slate-200 opacity-60' : 'border-slate-300'}`}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className={`w-full h-full block ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
                />
            </div>
            {!hasSignature ? (
                <p className="text-[10px] text-slate-400 text-center">Usa el dedo o el ratón para firmar dentro del recuadro</p>
            ) : (
                <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 py-2 rounded-lg border border-emerald-100">
                    <CircleCheck className="w-4 h-4" />
                    Firma capturada con éxito
                </div>
            )}
        </div>
    );
}

