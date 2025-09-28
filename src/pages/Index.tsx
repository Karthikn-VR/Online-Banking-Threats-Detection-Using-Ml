import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, CreditCard, TrendingUp, Lock, Smartphone, Globe, Users } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="bg-primary/10 backdrop-blur-sm border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-primary">SecureBank</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="hero" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-banking">
                <ShieldCheck className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Banking Made
              <span className="block bg-gradient-to-r from-secondary-light to-white bg-clip-text text-transparent">
                Secure & Simple
              </span>
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Experience next-generation banking with advanced security, real-time fraud detection, 
              and intuitive money management tools designed for the modern world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Open Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-primary">
                  <Shield className="w-5 h-5 mr-2" />
                  Existing Customer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              Why Choose SecureBank?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge technology and security-first approach to protect your financial future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-card hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Advanced Security</CardTitle>
                <CardDescription>
                  Multi-layer security with real-time fraud detection and AI-powered risk assessment.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle>Mobile First</CardTitle>
                <CardDescription>
                  Seamless banking experience across all devices with instant notifications and controls.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Smart Analytics</CardTitle>
                <CardDescription>
                  Intelligent insights into your spending patterns with personalized financial recommendations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle>Global Transfers</CardTitle>
                <CardDescription>
                  Send money worldwide with competitive rates and instant processing capabilities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>24/7 Support</CardTitle>
                <CardDescription>
                  Round-the-clock customer support with dedicated relationship managers for premium accounts.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle>FDIC Insured</CardTitle>
                <CardDescription>
                  Your deposits are protected up to $250,000 by FDIC insurance for complete peace of mind.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Experience the Future of Banking?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of satisfied customers who trust SecureBank with their financial future.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="hero" size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                <CreditCard className="w-5 h-5 mr-2" />
                Open Your Account Today
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Shield className="w-5 h-5 mr-2" />
                Admin Portal
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-primary-foreground/60">
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
              FDIC Insured
            </Badge>
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
              SOC 2 Compliant
            </Badge>
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
              Bank-Level Security
            </Badge>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="w-6 h-6" />
            <span className="text-xl font-bold">SecureBank</span>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            © 2024 SecureBank. All rights reserved. Member FDIC. Equal Housing Lender.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
