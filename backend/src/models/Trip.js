import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String
  },
  loc: {
    type: String
  },
  isAiSuggested: {
    type: Boolean,
    default: false
  }
});

// Format returned JSON for subdocuments
itinerarySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
  }
});

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    default: 'Other'
  },
  spentBy: {
    type: String,
    default: 'Me'
  }
});

expenseSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
  }
});

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true
    },
    source: {
      type: String,
      default: ''
    },
    destinations: {
      type: [String],
      default: []
    },
    route: {
      type: mongoose.Schema.Types.Mixed,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    weatherInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: ''
    },
    totalDistance: {
      type: String,
      default: ''
    },
    estimatedTime: {
      type: String,
      default: ''
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    budget: {
      type: Number,
      default: 0,
      min: 0
    },
    itinerary: [itinerarySchema],
    expenses: [expenseSchema],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    invitations: [
      {
        email: {
          type: String,
          required: true,
          trim: true,
          lowercase: true
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined'],
          default: 'pending'
        }
      }
    ],
    coverUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

tripSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
export { Trip };
