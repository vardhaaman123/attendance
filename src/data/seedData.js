// Seed data for Attendify - Smart School Attendance
// Realistic Indian student names and demo data

export const CLASSES = ['8', '9', '10'];
export const SECTIONS = ['A', 'B'];

const studentNames = {
  '8A': [
    { name: 'Aarav Kumar', parent: 'Rakesh Kumar', contact: '9876543210' },
    { name: 'Ananya Sharma', parent: 'Sunil Sharma', contact: '9876543211' },
    { name: 'Rahul Patil', parent: 'Vijay Patil', contact: '9876543212' },
    { name: 'Sneha Kulkarni', parent: 'Mohan Kulkarni', contact: '9876543213' },
    { name: 'Aditya Joshi', parent: 'Pradeep Joshi', contact: '9876543214' },
    { name: 'Priya Desai', parent: 'Hemant Desai', contact: '9876543215' },
    { name: 'Rohan More', parent: 'Santosh More', contact: '9876543216' },
    { name: 'Neha Shah', parent: 'Rajesh Shah', contact: '9876543217' },
    { name: 'Arjun Singh', parent: 'Harpreet Singh', contact: '9876543218' },
    { name: 'Kavya Nair', parent: 'Suresh Nair', contact: '9876543219' },
    { name: 'Vivek Reddy', parent: 'Ravi Reddy', contact: '9876543220' },
    { name: 'Pooja Mehta', parent: 'Amit Mehta', contact: '9876543221' },
    { name: 'Karan Kapoor', parent: 'Dinesh Kapoor', contact: '9876543222' },
    { name: 'Divya Pandey', parent: 'Shyam Pandey', contact: '9876543223' },
    { name: 'Siddharth Gupta', parent: 'Manoj Gupta', contact: '9876543224' },
    { name: 'Riya Verma', parent: 'Ashok Verma', contact: '9876543225' },
    { name: 'Akash Tiwari', parent: 'Ramesh Tiwari', contact: '9876543226' },
    { name: 'Shruti Bhat', parent: 'Girish Bhat', contact: '9876543227' },
    { name: 'Nikhil Mishra', parent: 'Suresh Mishra', contact: '9876543228' },
    { name: 'Pallavi Rao', parent: 'Venkat Rao', contact: '9876543229' },
    { name: 'Yash Malhotra', parent: 'Rajiv Malhotra', contact: '9876543230' },
    { name: 'Tanvi Chauhan', parent: 'Deepak Chauhan', contact: '9876543231' },
    { name: 'Harsh Saxena', parent: 'Pankaj Saxena', contact: '9876543232' },
    { name: 'Anjali Srivastava', parent: 'Alok Srivastava', contact: '9876543233' },
    { name: 'Mohit Bhatt', parent: 'Sunil Bhatt', contact: '9876543234' },
    { name: 'Shweta Pillai', parent: 'Krishnan Pillai', contact: '9876543235' },
    { name: 'Dhruv Aggarwal', parent: 'Naresh Aggarwal', contact: '9876543236' },
    { name: 'Isha Menon', parent: 'Rajan Menon', contact: '9876543237' },
    { name: 'Varun Khanna', parent: 'Sanjay Khanna', contact: '9876543238' },
    { name: 'Meera Iyer', parent: 'Srinivasan Iyer', contact: '9876543239' },
  ],
  '8B': [
    { name: 'Arnav Bose', parent: 'Debabrata Bose', contact: '9876544210' },
    { name: 'Sanya Banerjee', parent: 'Tapas Banerjee', contact: '9876544211' },
    { name: 'Kartik Sharma', parent: 'Vijendra Sharma', contact: '9876544212' },
    { name: 'Nidhi Chatterjee', parent: 'Suman Chatterjee', contact: '9876544213' },
    { name: 'Pranav Das', parent: 'Asim Das', contact: '9876544214' },
    { name: 'Ritika Ghosh', parent: 'Partha Ghosh', contact: '9876544215' },
    { name: 'Sameer Roy', parent: 'Dipak Roy', contact: '9876544216' },
    { name: 'Trisha Sen', parent: 'Anup Sen', contact: '9876544217' },
    { name: 'Ujjwal Dutta', parent: 'Biswajit Dutta', contact: '9876544218' },
    { name: 'Vanya Mukherjee', parent: 'Soumen Mukherjee', contact: '9876544219' },
    { name: 'Waman Chandra', parent: 'Prakash Chandra', contact: '9876544220' },
    { name: 'Xenia Paul', parent: 'Thomas Paul', contact: '9876544221' },
    { name: 'Yuvraj Sinha', parent: 'Vijay Sinha', contact: '9876544222' },
    { name: 'Zara Khan', parent: 'Farrukh Khan', contact: '9876544223' },
    { name: 'Abhi Tripathi', parent: 'Ramakant Tripathi', contact: '9876544224' },
    { name: 'Bhavna Ojha', parent: 'Dinesh Ojha', contact: '9876544225' },
    { name: 'Chirag Dubey', parent: 'Umesh Dubey', contact: '9876544226' },
    { name: 'Disha Yadav', parent: 'Ramesh Yadav', contact: '9876544227' },
    { name: 'Esha Shukla', parent: 'Anil Shukla', contact: '9876544228' },
    { name: 'Farhan Siddiqui', parent: 'Salim Siddiqui', contact: '9876544229' },
    { name: 'Gauri Thapar', parent: 'Vinod Thapar', contact: '9876544230' },
    { name: 'Hemant Bajaj', parent: 'Suresh Bajaj', contact: '9876544231' },
    { name: 'Ipshita Garg', parent: 'Naresh Garg', contact: '9876544232' },
    { name: 'Jagdish Rawat', parent: 'Mohan Rawat', contact: '9876544233' },
    { name: 'Kiran Bisht', parent: 'Diwan Bisht', contact: '9876544234' },
    { name: 'Lavanya Pillai', parent: 'Murali Pillai', contact: '9876544235' },
    { name: 'Manish Tomar', parent: 'Mahavir Tomar', contact: '9876544236' },
    { name: 'Nisha Patel', parent: 'Girish Patel', contact: '9876544237' },
    { name: 'Omkar Bhosale', parent: 'Dattatray Bhosale', contact: '9876544238' },
    { name: 'Payal Gokhale', parent: 'Sudhir Gokhale', contact: '9876544239' },
  ],
  '9A': [
    { name: 'Aakash Mehta', parent: 'Bharat Mehta', contact: '9876545210' },
    { name: 'Bhumi Patel', parent: 'Haresh Patel', contact: '9876545211' },
    { name: 'Chetan Jain', parent: 'Rajkumar Jain', contact: '9876545212' },
    { name: 'Deepika Agarwal', parent: 'Suresh Agarwal', contact: '9876545213' },
    { name: 'Eklavya Singh', parent: 'Amarjeet Singh', contact: '9876545214' },
    { name: 'Falguni Trivedi', parent: 'Navin Trivedi', contact: '9876545215' },
    { name: 'Gaurav Chavan', parent: 'Ramesh Chavan', contact: '9876545216' },
    { name: 'Harini Krishnan', parent: 'Balaji Krishnan', contact: '9876545217' },
    { name: 'Ishan Kulkarni', parent: 'Prakash Kulkarni', contact: '9876545218' },
    { name: 'Juhi Thakur', parent: 'Santosh Thakur', contact: '9876545219' },
    { name: 'Kishore Nanda', parent: 'Mahesh Nanda', contact: '9876545220' },
    { name: 'Lakshmi Varma', parent: 'Gopal Varma', contact: '9876545221' },
    { name: 'Mihir Bhandari', parent: 'Sunil Bhandari', contact: '9876545222' },
    { name: 'Nandini Ghosh', parent: 'Arun Ghosh', contact: '9876545223' },
    { name: 'Om Prakash Sharma', parent: 'Brijmohan Sharma', contact: '9876545224' },
    { name: 'Parveen Kaur', parent: 'Gurpreet Singh', contact: '9876545225' },
    { name: 'Quasar Iyer', parent: 'Rajan Iyer', contact: '9876545226' },
    { name: 'Ruchika Saxena', parent: 'Avinash Saxena', contact: '9876545227' },
    { name: 'Soham Das', parent: 'Pranab Das', contact: '9876545228' },
    { name: 'Tanya Kapoor', parent: 'Vikram Kapoor', contact: '9876545229' },
    { name: 'Utkarsh Pandey', parent: 'Jagdish Pandey', contact: '9876545230' },
    { name: 'Vidya Shenoy', parent: 'Ramakrishna Shenoy', contact: '9876545231' },
    { name: 'Wasim Ansari', parent: 'Imtiaz Ansari', contact: '9876545232' },
    { name: 'Xena Rodrigues', parent: 'Joseph Rodrigues', contact: '9876545233' },
    { name: 'Yashvi Gupta', parent: 'Vikas Gupta', contact: '9876545234' },
    { name: 'Zeel Shah', parent: 'Bhavesh Shah', contact: '9876545235' },
    { name: 'Anshul Tiwari', parent: 'Ravindra Tiwari', contact: '9876545236' },
    { name: 'Bindiya Rao', parent: 'Subhash Rao', contact: '9876545237' },
    { name: 'Chinmay Deshpande', parent: 'Pramod Deshpande', contact: '9876545238' },
    { name: 'Disha Malviya', parent: 'Rajendra Malviya', contact: '9876545239' },
    { name: 'Eshan Dubey', parent: 'Pradeep Dubey', contact: '9876545240' },
    { name: 'Foram Patel', parent: 'Kantibhai Patel', contact: '9876545241' },
  ],
  '9B': [
    { name: 'Gaurangi Mehta', parent: 'Deepak Mehta', contact: '9876546210' },
    { name: 'Harshit Mishra', parent: 'Rajeev Mishra', contact: '9876546211' },
    { name: 'Ishaan Khanna', parent: 'Alok Khanna', contact: '9876546212' },
    { name: 'Jaya Pillai', parent: 'Suresh Pillai', contact: '9876546213' },
    { name: 'Kavish Verma', parent: 'Deependra Verma', contact: '9876546214' },
    { name: 'Lalit Yadav', parent: 'Rajendra Yadav', contact: '9876546215' },
    { name: 'Manavi Bose', parent: 'Subir Bose', contact: '9876546216' },
    { name: 'Neel Shah', parent: 'Ketan Shah', contact: '9876546217' },
    { name: 'Ovi Dutta', parent: 'Asish Dutta', contact: '9876546218' },
    { name: 'Palak Joshi', parent: 'Sanjiv Joshi', contact: '9876546219' },
    { name: 'Rachit Sinha', parent: 'Ashwini Sinha', contact: '9876546220' },
    { name: 'Saachi Trivedi', parent: 'Ganesh Trivedi', contact: '9876546221' },
    { name: 'Tanmay Roy', parent: 'Apurba Roy', contact: '9876546222' },
    { name: 'Uma Shankar Singh', parent: 'Shiv Singh', contact: '9876546223' },
    { name: 'Vaishnavi Kulkarni', parent: 'Anand Kulkarni', contact: '9876546224' },
    { name: 'Wansh Kapoor', parent: 'Tarun Kapoor', contact: '9876546225' },
    { name: 'Yamini Reddy', parent: 'Prasad Reddy', contact: '9876546226' },
    { name: 'Zia Khan', parent: 'Arshad Khan', contact: '9876546227' },
    { name: 'Anuj Agarwal', parent: 'Sushil Agarwal', contact: '9876546228' },
    { name: 'Bhavika Shukla', parent: 'Satish Shukla', contact: '9876546229' },
    { name: 'Chitrali Desai', parent: 'Praful Desai', contact: '9876546230' },
    { name: 'Darshan Patil', parent: 'Dattatray Patil', contact: '9876546231' },
    { name: 'Esha Nair', parent: 'Rajiv Nair', contact: '9876546232' },
    { name: 'Farida Shaikh', parent: 'Ibrahim Shaikh', contact: '9876546233' },
    { name: 'Gaurav Tomar', parent: 'Ramveer Tomar', contact: '9876546234' },
    { name: 'Hema Pandey', parent: 'Ramchandra Pandey', contact: '9876546235' },
    { name: 'Inder Chauhan', parent: 'Bhupendra Chauhan', contact: '9876546236' },
    { name: 'Jayashree Iyer', parent: 'Chandrasekhar Iyer', contact: '9876546237' },
    { name: 'Kshitij More', parent: 'Sudhakar More', contact: '9876546238' },
    { name: 'Lipika Sen', parent: 'Samar Sen', contact: '9876546239' },
  ],
  '10A': [
    { name: 'Aman Gupta', parent: 'Vinay Gupta', contact: '9876547210' },
    { name: 'Babita Singh', parent: 'Ravindra Singh', contact: '9876547211' },
    { name: 'Chaitanya Sharma', parent: 'Arvind Sharma', contact: '9876547212' },
    { name: 'Damini Joshi', parent: 'Narendra Joshi', contact: '9876547213' },
    { name: 'Ekta Mishra', parent: 'Virendra Mishra', contact: '9876547214' },
    { name: 'Firoz Ahmed', parent: 'Nazir Ahmed', contact: '9876547215' },
    { name: 'Geetanjali Rao', parent: 'Madhava Rao', contact: '9876547216' },
    { name: 'Hitesh Patel', parent: 'Dhirajlal Patel', contact: '9876547217' },
    { name: 'Ishita Banerjee', parent: 'Debdas Banerjee', contact: '9876547218' },
    { name: 'Jayant Kumar', parent: 'Suresh Kumar', contact: '9876547219' },
    { name: 'Khushboo Verma', parent: 'Ramesh Verma', contact: '9876547220' },
    { name: 'Lokesh Tiwari', parent: 'Shivram Tiwari', contact: '9876547221' },
    { name: 'Madhuri Bhat', parent: 'Mohan Bhat', contact: '9876547222' },
    { name: 'Naveen Pillai', parent: 'Krishnan Pillai', contact: '9876547223' },
    { name: 'Oindrila Das', parent: 'Swapan Das', contact: '9876547224' },
    { name: 'Parikshit Dubey', parent: 'Shailendra Dubey', contact: '9876547225' },
    { name: 'Rachna Saxena', parent: 'Satendra Saxena', contact: '9876547226' },
    { name: 'Sagar Mehta', parent: 'Jayesh Mehta', contact: '9876547227' },
    { name: 'Tanishka Kulkarni', parent: 'Mangesh Kulkarni', contact: '9876547228' },
    { name: 'Uday Thakur', parent: 'Bhagwan Thakur', contact: '9876547229' },
    { name: 'Vandana Chauhan', parent: 'Surendra Chauhan', contact: '9876547230' },
    { name: 'Wajid Ali', parent: 'Shaukat Ali', contact: '9876547231' },
    { name: 'Xenil Kapoor', parent: 'Rajan Kapoor', contact: '9876547232' },
    { name: 'Yogesh Pandey', parent: 'Chandrabhan Pandey', contact: '9876547233' },
    { name: 'Zeba Siddiqui', parent: 'Mohsin Siddiqui', contact: '9876547234' },
    { name: 'Akanksha Trivedi', parent: 'Hemant Trivedi', contact: '9876547235' },
    { name: 'Bharat Malhotra', parent: 'Ajay Malhotra', contact: '9876547236' },
    { name: 'Chanda Rawat', parent: 'Jagdish Rawat', contact: '9876547237' },
    { name: 'Devesh Agarwal', parent: 'Subhash Agarwal', contact: '9876547238' },
    { name: 'Elina Fernandes', parent: 'Xavier Fernandes', contact: '9876547239' },
    { name: 'Faiz Khan', parent: 'Iqbal Khan', contact: '9876547240' },
    { name: 'Gargi Ghosh', parent: 'Biplab Ghosh', contact: '9876547241' },
  ],
  '10B': [
    { name: 'Harshal Jain', parent: 'Mahendra Jain', contact: '9876548210' },
    { name: 'Indu Yadav', parent: 'Mukesh Yadav', contact: '9876548211' },
    { name: 'Jitendra Soni', parent: 'Bhanwarlal Soni', contact: '9876548212' },
    { name: 'Kamini Rao', parent: 'Nageshwar Rao', contact: '9876548213' },
    { name: 'Lakhan Tomar', parent: 'Ghanshyam Tomar', contact: '9876548214' },
    { name: 'Mamta Devi', parent: 'Rajkishore Devi', contact: '9876548215' },
    { name: 'Naman Batra', parent: 'Sudhir Batra', contact: '9876548216' },
    { name: 'Ojasvini Mishra', parent: 'Arun Mishra', contact: '9876548217' },
    { name: 'Pradeep Nair', parent: 'Sreekumar Nair', contact: '9876548218' },
    { name: 'Qaiser Hussain', parent: 'Bashir Hussain', contact: '9876548219' },
    { name: 'Ranjana Patel', parent: 'Bipinchandra Patel', contact: '9876548220' },
    { name: 'Sudhir Chandra', parent: 'Ramakant Chandra', contact: '9876548221' },
    { name: 'Trishna Roy', parent: 'Sujit Roy', contact: '9876548222' },
    { name: 'Upasana Bose', parent: 'Arindam Bose', contact: '9876548223' },
    { name: 'Vibha Shukla', parent: 'Vinod Shukla', contact: '9876548224' },
    { name: 'Waman Desai', parent: 'Haresh Desai', contact: '9876548225' },
    { name: 'Xena Jain', parent: 'Vinay Jain', contact: '9876548226' },
    { name: 'Yatin More', parent: 'Sanjay More', contact: '9876548227' },
    { name: 'Zeena Ansari', parent: 'Rashid Ansari', contact: '9876548228' },
    { name: 'Amit Bhatt', parent: 'Ramesh Bhatt', contact: '9876548229' },
    { name: 'Brinda Shenoy', parent: 'Balachandran Shenoy', contact: '9876548230' },
    { name: 'Chintan Shah', parent: 'Bhupen Shah', contact: '9876548231' },
    { name: 'Devyani Kulkarni', parent: 'Narayan Kulkarni', contact: '9876548232' },
    { name: 'Eshaan Pillai', parent: 'Mohan Pillai', contact: '9876548233' },
    { name: 'Falak Singh', parent: 'Tejinder Singh', contact: '9876548234' },
    { name: 'Gopal Verma', parent: 'Narendra Verma', contact: '9876548235' },
    { name: 'Hina Siddiqui', parent: 'Sajid Siddiqui', contact: '9876548236' },
    { name: 'Ilesh Pandya', parent: 'Kishore Pandya', contact: '9876548237' },
    { name: 'Jhanvi Mehta', parent: 'Anand Mehta', contact: '9876548238' },
    { name: 'Kartikay Sharma', parent: 'Naresh Sharma', contact: '9876548239' },
  ],
};

function generateStudents() {
  const students = [];
  let globalId = 1;

  Object.entries(studentNames).forEach(([key, nameList]) => {
    const classNum = key.slice(0, -1);
    const section = key.slice(-1);

    nameList.forEach((info, index) => {
      students.push({
        id: `STU${String(globalId).padStart(4, '0')}`,
        rollNumber: String(index + 1).padStart(2, '0'),
        name: info.name,
        class: classNum,
        section: section,
        parentName: info.parent,
        contact: info.contact,
        email: `${info.name.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
        status: 'active',
      });
      globalId++;
    });
  });

  return students;
}

function generateAttendanceHistory(students) {
  const records = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate last 30 days of attendance (excluding weekends)
  for (let d = 29; d >= 1; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const dateStr = date.toISOString().split('T')[0];

    CLASSES.forEach(cls => {
      SECTIONS.forEach(section => {
        const key = `${cls}-${section}`;
        const classStudents = students.filter(s => s.class === cls && s.section === section);

        const attendance = {};
        classStudents.forEach(student => {
          const rand = Math.random();
          let status;
          if (rand < 0.05) status = 'absent';
          else if (rand < 0.10) status = 'late';
          else status = 'present';

          // Some students with low attendance
          if (['STU0002', 'STU0008', 'STU0015', 'STU0022', 'STU0031', 'STU0045'].includes(student.id)) {
            const rand2 = Math.random();
            status = rand2 < 0.35 ? 'absent' : rand2 < 0.45 ? 'late' : 'present';
          }

          attendance[student.id] = status;
        });

        const recordKey = `${dateStr}_${cls}_${section}`;
        records[recordKey] = {
          date: dateStr,
          class: cls,
          section: section,
          attendance,
          savedAt: new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString(),
        };
      });
    });
  }

  return records;
}

export function initializeSeedData() {
  const existingStudents = localStorage.getItem('attendify_students');
  const existingRecords = localStorage.getItem('attendify_attendance');

  if (!existingStudents) {
    const students = generateStudents();
    localStorage.setItem('attendify_students', JSON.stringify(students));
  }

  if (!existingRecords) {
    const students = JSON.parse(localStorage.getItem('attendify_students'));
    const records = generateAttendanceHistory(students);
    localStorage.setItem('attendify_attendance', JSON.stringify(records));
  }

  // Settings defaults
  if (!localStorage.getItem('attendify_settings')) {
    localStorage.setItem('attendify_settings', JSON.stringify({
      schoolName: 'Delhi Public School',
      schoolLogo: null,
      teacherName: 'Mrs. Anjali Sharma',
      darkMode: false,
      notifications: true,
    }));
  }
}
