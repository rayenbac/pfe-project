import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {
  faqs: FAQ[] = [
    {
      id: 1,
      question: "How do I search for properties?",
      answer: "You can search for properties using our advanced search feature. Simply enter your preferred location, price range, property type, and other criteria to find matching properties. You can also use our natural language search to describe what you're looking for in plain English.",
      isOpen: false
    },
    {
      id: 2,
      question: "How do I contact a property agent?",
      answer: "Each property listing has a 'Contact Agent' button. You can click on it to send a message directly to the property agent. You can also use our chat feature to have real-time conversations with agents.",
      isOpen: false
    },
    {
      id: 3,
      question: "Is it free to use FindHouse?",
      answer: "Yes, browsing properties and contacting agents is completely free for buyers and renters. Property owners and agents may have different pricing plans for listing properties on our platform.",
      isOpen: false
    },
    {
      id: 4,
      question: "How do I save my favorite properties?",
      answer: "You need to create an account and log in to save properties to your favorites. Once logged in, you'll see a heart icon on each property that you can click to add it to your favorites list.",
      isOpen: false
    },
    {
      id: 5,
      question: "Can I schedule property viewings?",
      answer: "Yes, you can schedule property viewings by contacting the agent directly through our platform. Many agents also offer virtual tours and video calls for initial viewings.",
      isOpen: false
    },
    {
      id: 6,
      question: "How do I list my property?",
      answer: "To list your property, you need to create an account and register as an agent or property owner. Once approved, you can access the property listing tools and add your properties with photos, descriptions, and pricing information.",
      isOpen: false
    },
    {
      id: 7,
      question: "What payment methods do you accept?",
      answer: "We accept various payment methods including credit cards, PayPal, and bank transfers. Payment is only required for premium services like featured listings or agent subscriptions.",
      isOpen: false
    },
    {
      id: 8,
      question: "How do I reset my password?",
      answer: "Click on the 'Forgot Password?' link on the login page. Enter your email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password.",
      isOpen: false
    }
  ];

  constructor() { }

  toggleFAQ(faqId: number): void {
    this.faqs = this.faqs.map(faq => ({
      ...faq,
      isOpen: faq.id === faqId ? !faq.isOpen : false
    }));
  }
}
