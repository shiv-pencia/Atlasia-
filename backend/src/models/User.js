import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    profileImage: {
      type: String,
      default: ''
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Format returned JSON (exclude password and version key, map _id to id)
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.password;
  }
});

const User = mongoose.model('User', userSchema);

export default User;
export { User };
