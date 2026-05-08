"use client";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { authFetch } from "../../../utils/authFetch";
import { Download, Printer, ArrowLeft, CheckCircle, XCircle, Clock, Truck, Package } from "lucide-react";
import Logo from '../../../../public/img/Header/LogoInvoice.png';
import { COLORS } from "../../../constants/colors";
import { buildApiUrl, API_ENDPOINTS } from "../../../utils/api";
import DefaultImage from '../../../../public/img/ProductImageDefault.svg';

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL;

const formatCurrency = (amount) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function InvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  async function fetchInvoiceData() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await authFetch(`${buildApiUrl(API_ENDPOINTS.order.getOrderItemById)}/${id}`);
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }
      
      const json = await res.json();
      
      if (json.status !== 200 || !json.data) {
        throw new Error(json.msg || 'Failed to fetch invoice data');
      }
      
      const orderItem = json.data.order_item?.find((item) => item.id === parseInt(id));
      
      if (!orderItem) {
        throw new Error('Order item not found');
      }
      
      setData({
        order_item: orderItem,
        order: json.data.order,
        user: json.data.user
      });
      
    } catch (err) {
      console.error('Invoice fetch error:', err);
      setError(err.message || 'Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  }

  function generatePDF() {
    if (!data) return;

    const item = data.order_item;
    const order = data.order;
    const user = data.user;

    const unitPrice = parseFloat(item.sale_price) || 0;
    const fees = parseFloat(item.fees) || 0;
    const total = unitPrice + fees;
    const mrp = parseFloat(item.current_price) || 0;
    const discount = mrp - unitPrice;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    doc.setFont("helvetica");

    doc.setFillColor(204, 172, 109); 
    doc.rect(0, 0, pageWidth, 30, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PERFUMERY", margin, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("www.Perfumery.in | support@perfumery.in", margin, 18);

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", pageWidth - margin, 15, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - margin, 22, { align: "right" });

    let yPos = 40;

    doc.setFillColor(245, 245, 245); 
    doc.rect(margin, yPos, pageWidth - (margin * 2), 30, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 30);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55); 
    doc.text("Order Information", margin + 5, yPos + 10);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);

    doc.text("Order ID:", margin + 5, yPos + 17);
    doc.text(order.id.toString(), margin + 25, yPos + 17);

    doc.text("Invoice No:", margin + 5, yPos + 22);
    doc.text(`PERF-${item.id}`, margin + 25, yPos + 22);

    doc.text("Order Date:", pageWidth - margin - 60, yPos + 10);
    doc.text(formatDate(order.created_at), pageWidth - margin - 30, yPos + 10, { align: "right" });

    doc.text("Order Status:", pageWidth - margin - 60, yPos + 17);
    doc.setFont("helvetica", "bold");
    const status = item.item_status.replace(/_/g, ' ').toUpperCase();
    doc.text(status, pageWidth - margin - 30, yPos + 17, { align: "right" });
    doc.setFont("helvetica", "normal");

    doc.setFont("helvetica", "bold");
    doc.text("Payment Details", pageWidth - margin - 60, yPos + 25);

    doc.setFont("helvetica", "normal");
    doc.text("Payment Method:", pageWidth - margin - 60, yPos + 30);
    const paymentMethod = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment';
    doc.text(paymentMethod, pageWidth - margin - 30, yPos + 30, { align: "right" });

    yPos += 40;

    const sectionWidth = (pageWidth - (margin * 2) - 20) / 2;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, sectionWidth, 60, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, yPos, sectionWidth, 60);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    doc.text("Billed To", margin + 10, yPos + 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);

    let textY = yPos + 22;
    doc.text(user.name, margin + 10, textY);
    textY += 5;
    doc.text(user.phone, margin + 10, textY);
    textY += 5;
    doc.text(user.email, margin + 10, textY);
    textY += 8;

    doc.setDrawColor(220, 220, 220);
    doc.line(margin + 10, textY - 3, margin + sectionWidth - 10, textY - 3);

    doc.text(user.address.line1, margin + 10, textY);
    textY += 5;
    if (user.address.line2) {
      doc.text(user.address.line2, margin + 10, textY);
      textY += 5;
    }
    doc.text(`${user.address.city}, ${user.address.state}`, margin + 10, textY);
    textY += 5;
    doc.text(`${user.address.postal_code}, ${user.address.country}`, margin + 10, textY);

    const shippedX = margin + sectionWidth + 20;
    doc.setFillColor(245, 245, 245);
    doc.rect(shippedX, yPos, sectionWidth, 60, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(shippedX, yPos, sectionWidth, 60);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    doc.text("Shipped To", shippedX + 10, yPos + 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);

    textY = yPos + 22;
    doc.text(user.name, shippedX + 10, textY);
    textY += 5;
    doc.text(user.phone, shippedX + 10, textY);
    textY += 5;
    doc.text(user.email, shippedX + 10, textY);
    textY += 8;

    doc.setDrawColor(220, 220, 220);
    doc.line(shippedX + 10, textY - 3, shippedX + sectionWidth - 10, textY - 3);

    doc.text(user.address.line1, shippedX + 10, textY);
    textY += 5;
    if (user.address.line2) {
      doc.text(user.address.line2, shippedX + 10, textY);
      textY += 5;
    }
    doc.text(`${user.address.city}, ${user.address.state}`, shippedX + 10, textY);
    textY += 5;
    doc.text(`${user.address.postal_code}, ${user.address.country}`, shippedX + 10, textY);

    yPos += 70;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    doc.text("Product Details", margin, yPos);
    yPos += 5;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 8, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 8);

    const colWidths = [80, 25, 25, 25, 25];
    let xPos = margin;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(75, 85, 99);
    doc.text("Product", xPos + 5, yPos + 5.5);
    xPos += colWidths[0];
    doc.text("Quantity", xPos + 5, yPos + 5.5);
    xPos += colWidths[1];
    doc.text("MRP", xPos + 5, yPos + 5.5, { align: "right" });
    xPos += colWidths[2];
    doc.text("Price", xPos + 5, yPos + 5.5, { align: "right" });
    xPos += colWidths[3];
    doc.text("Total", xPos + 5, yPos + 5.5, { align: "right" });

    yPos += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    const productText = `${item.product_title}\nVariant: ${item.variant_name}`;
    const productLines = doc.splitTextToSize(productText, colWidths[0] - 10);
    
    const lineHeight = 4.5;
    const rowHeight = Math.max(productLines.length * lineHeight, 15) + 5;
    
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, yPos, pageWidth - (margin * 2), rowHeight, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, yPos, pageWidth - (margin * 2), rowHeight);
    
    xPos = margin;
    doc.setTextColor(31, 41, 55);
    let textStartY = yPos + 5;
    productLines.forEach((line, index) => {
      doc.text(line, xPos + 5, textStartY + (index * lineHeight));
    });
    
    xPos += colWidths[0];
    doc.text(item.quantity.toString(), xPos + (colWidths[1] / 2), yPos + (rowHeight / 2), { align: "center" });
    
    xPos += colWidths[1];
    doc.setTextColor(107, 114, 128); 
    doc.text(formatCurrency(mrp), xPos + colWidths[2] - 5, yPos + (rowHeight / 2), { align: "right" });
    
    xPos += colWidths[2];
    doc.setTextColor(31, 41, 55);
    doc.text(formatCurrency(unitPrice), xPos + colWidths[3] - 5, yPos + (rowHeight / 2), { align: "right" });
    
    xPos += colWidths[3];
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(unitPrice * item.quantity), xPos + colWidths[4] - 5, yPos + (rowHeight / 2), { align: "right" });
    
    yPos += rowHeight + 15;

    const summaryWidth = 96;
    const summaryX = pageWidth - margin - summaryWidth;
    
    doc.setFillColor(245, 245, 245);
    doc.rect(summaryX, yPos, summaryWidth, 75, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(summaryX, yPos, summaryWidth, 75);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    doc.text("Price Summary", summaryX + 10, yPos + 15);

    let summaryY = yPos + 25;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);

    doc.text("MRP:", summaryX + 10, summaryY);
    doc.text(formatCurrency(mrp), summaryX + summaryWidth - 10, summaryY, { align: "right" });
    summaryY += 6;

    if (discount > 0) {
      doc.text("Discount:", summaryX + 10, summaryY);
      doc.setTextColor(22, 163, 74); 
      doc.text(`-${formatCurrency(discount)}`, summaryX + summaryWidth - 10, summaryY, { align: "right" });
      doc.setTextColor(75, 85, 99);
      summaryY += 6;
    }

    if (fees > 0) {
      doc.text("Platform Fee:", summaryX + 10, summaryY);
      doc.text(formatCurrency(fees), summaryX + summaryWidth - 10, summaryY, { align: "right" });
      summaryY += 6;
    }

    summaryY += 5;
    doc.setDrawColor(220, 220, 220);
    doc.line(summaryX + 10, summaryY - 2, summaryX + summaryWidth - 10, summaryY - 2);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    doc.text("Grand Total:", summaryX + 10, summaryY + 8);

    doc.setFontSize(16);
    doc.setTextColor(204, 172, 109);
    doc.text(formatCurrency(total), summaryX + summaryWidth - 10, summaryY + 8, { align: "right" });

    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);

    doc.text("Thank you for shopping with Perfumery!", pageWidth / 2, footerY - 15, { align: "center" });
    doc.text("This is a computer-generated invoice. No signature required.", pageWidth / 2, footerY - 10, { align: "center" });
    doc.text("For any queries, contact: sales@perfumerykart.com | +91 88664 97602", pageWidth / 2, footerY - 5, { align: "center" });

    doc.save(`Invoice-PERF-${item.id}-${order.id}.pdf`);
  }

  const printInvoice = () => {
    window.print();
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'cancelled':
      case 'returned':
        return <XCircle className="text-red-600" size={20} />;
      case 'pending':
      case 'confirmed':
        return <Clock className="text-yellow-600" size={20} />;
      case 'shipped':
      case 'outofdelivered':
        return <Truck className="text-blue-600" size={20} />;
      default:
        return <Package className="text-gray-600" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#CCAC6D] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Invoice</h2>
          <p className="text-gray-600 mb-6">{error || "Invoice data not available"}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-[#CCAC6D] text-white rounded-lg hover:bg-[#b8955a] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const item = data.order_item;
  const order = data.order;
  const user = data.user;

  const unitPrice = parseFloat(item.sale_price) || 0;
  const fees = parseFloat(item.fees) || 0;
  const total = unitPrice + fees;
  const mrp = parseFloat(item.current_price) || 0;
  const discount = mrp - unitPrice;

  return (
    <div className="invoice-page-offset min-h-screen p-4 md:p-6 font-sans pt-[140px]" style={{ backgroundColor: COLORS.BgLight }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:text-[#b8955a] transition-colors"
            style={{ color: COLORS.Primary }}
          >
            <ArrowLeft size={20} />
            <span>Back to Order</span>
          </button>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={printInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Print Invoice</span>
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:bg-[#b8955a] transition-colors"
              style={{ backgroundColor: COLORS.Primary }}
            >
              <Download size={18} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl shadow-lg overflow-hidden print:shadow-none" style={{ backgroundColor: COLORS.White }}>
          <div className="p-6 md:p-8 text-white" style={{ backgroundColor: COLORS.Primary }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-25 flex flex-col items-start gap-1">
                  <div className="w-30 h-5 relative">
                    <Image
                      src={Logo}
                      alt="Perfumery Logo"
                      fill
                      className="object-contain"
                    />
                  </div>

                  <p className="text-[11px] opacity-90 leading-tight">
                    www.Perfumery.in | support@perfumery.in
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl md:text-2xl font-bold">TAX INVOICE</h2>
                <p className="text-sm mt-1">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 rounded-lg" style={{ backgroundColor: COLORS.BgLight }}
>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {getStatusIcon(item.item_status)}
                  <h3 className="text-lg font-semibold text-gray-800">Order Information</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Order ID:</span>
                    <span className="font-medium">{order.id}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Invoice No:</span>
                    <span className="font-medium">PERF-{item.id}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Order Date:</span>
                    <span className="font-medium">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Order Status:</span>
                    <span className={`font-medium capitalize px-2 py-1 rounded text-sm ${
                      item.item_status === 'delivered' ? 'bg-green-100 text-green-800' :
                      item.item_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.item_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Details</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Payment Status:</span>
                    <span className={`font-medium capitalize px-2 py-1 rounded text-sm ${
                      order.payment_status === 'success' ? 'bg-green-100 text-green-800' :
                      order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="p-5 rounded-lg" style={{ backgroundColor: COLORS.BgLight }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>👤</span> Billed To
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-gray-600">{user.phone}</p>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-600">{user.address.line1}</p>
                    <p className="text-gray-600">{user.address.line2 && `${user.address.line2}, `}</p>
                    <p className="text-gray-600">{user.address.city}, {user.address.state}</p>
                    <p className="text-gray-600">{user.address.postal_code}, {user.address.country}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-lg" style={{ backgroundColor: COLORS.BgLight }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🚚</span> Shipped To
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-gray-600">{user.phone}</p>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-600">{user.address.line1}</p>
                    <p className="text-gray-600">{user.address.line2 && `${user.address.line2}, `}</p>
                    <p className="text-gray-600">{user.address.city}, {user.address.state}</p>
                    <p className="text-gray-600">{user.address.postal_code}, {user.address.country}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h3>
              <div className="rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.BgLight }}>
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 font-medium text-gray-700">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">MRP</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-1 text-right">Total</div>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 flex-shrink-0 relative rounded-lg overflow-hidden bg-white">
                          <Image
                            src={item.image ? `${BASE_IMAGE_URL}product/${item.image}` : DefaultImage}
                            alt={item.product_title}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target;
                              target.src = '/img/ProductImageDefault.svg';
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.product_title}</h4>
                          <p className="text-sm text-gray-600 mt-1">Variant: {item.variant_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="text-lg font-medium">{item.quantity}</div>
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="text-gray-500 line-through">{formatCurrency(mrp)}</div>
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(unitPrice)}</div>
                    </div>
                    <div className="col-span-1 text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(unitPrice * item.quantity)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-full md:w-96 rounded-lg p-6" style={{ backgroundColor: COLORS.BgLight }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">MRP:</span>
                    <span className="text-gray-800">{formatCurrency(mrp)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="text-green-600">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  
                  {fees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee:</span>
                      <span className="text-gray-800">{formatCurrency(fees)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Grand Total:</span>
                      <span className="text-2xl font-bold" style={{ color: COLORS.Primary }}>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center text-gray-600 text-sm">
                <p>Thank you for shopping with Perfumery!</p>
                <p className="mt-1">This is a computer-generated invoice. No signature is required.</p>
                <p className="mt-2 text-xs">
                  For any queries, please contact: sales@perfumerykart.com | +91 88664 97602
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
          <p>For best results when printing, use "Save as PDF" in your browser's print dialog.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .invoice-page-offset {
            padding-top: 0 !important;
          }
          .bg-\\[#F8F5F0\\] {
            background: white !important;
          }
          .shadow-lg {
            box-shadow: none !important;
          }
          .rounded-xl {
            border-radius: 0 !important;
          }
          .overflow-hidden {
            overflow: visible !important;
          }
          .gap-4, .gap-6, .gap-8 {
            gap: 12px !important;
          }
          .p-6, .p-8 {
            padding: 16px !important;
          }
          .text-2xl, .text-3xl {
            font-size: 18px !important;
          }
          .text-lg {
            font-size: 14px !important;
          }
          .text-sm {
            font-size: 10px !important;
          }
          .text-xs {
            font-size: 8px !important;
          }
          .mb-6, .mb-8 {
            margin-bottom: 12px !important;
          }
          .mt-6, .mt-8 {
            margin-top: 12px !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}